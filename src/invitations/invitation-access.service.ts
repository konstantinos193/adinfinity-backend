import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessMode } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

/** Unlock attempts allowed per IP+slug inside the window. */
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

/** How long an unlocked guest stays unlocked. */
const TOKEN_TTL = '30d';

const TOKEN_SCOPE = 'invitation-access';

interface AccessTokenPayload {
  slug: string;
  scope: typeof TOKEN_SCOPE;
}

@Injectable()
export class InvitationAccessService {
  private readonly logger = new Logger(InvitationAccessService.name);

  /**
   * Brute-force friction for the unlock endpoint. A 4-digit PIN is only 10.000
   * combinations, so an unthrottled endpoint is equivalent to no PIN at all.
   * In-memory and per-process, same trade-off as LeadsController.
   */
  private readonly attempts = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Hashes a PIN for storage. Returns null to clear it. */
  async hashPin(pin: string | null | undefined): Promise<string | null> {
    if (!pin) return null;
    return bcrypt.hash(pin, 10);
  }

  /**
   * True when the bearer token grants access to this specific slug. A token
   * minted for one invitation must never unlock another.
   */
  isUnlocked(slug: string, authorization?: string): boolean {
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (!token) return false;

    try {
      const payload = this.jwt.verify<AccessTokenPayload>(token);
      return payload.scope === TOKEN_SCOPE && payload.slug === slug;
    } catch {
      return false;
    }
  }

  /**
   * Verifies the PIN and mints a slug-scoped token.
   *
   * Returns the same 401 whether the invitation is missing, public, or the PIN
   * is wrong — otherwise the endpoint becomes an oracle for which slugs exist
   * and which are protected.
   */
  async unlock(slug: string, pin: string, ip: string) {
    this.enforceRateLimit(`${ip}:${slug}`);

    const inv = await this.prisma.invitation.findUnique({
      where: { slug },
      select: { accessMode: true, accessPin: true },
    });

    const unauthorized = new HttpException(
      'Λάθος κωδικός.',
      HttpStatus.UNAUTHORIZED,
    );

    if (!inv || inv.accessMode !== AccessMode.PIN || !inv.accessPin) {
      throw unauthorized;
    }

    const ok = await bcrypt.compare(pin, inv.accessPin);
    if (!ok) throw unauthorized;

    const payload: AccessTokenPayload = { slug, scope: TOKEN_SCOPE };
    return { token: this.jwt.sign(payload, { expiresIn: TOKEN_TTL }) };
  }

  /** Throws 404 for a missing invitation, 401 when it's locked and untrusted. */
  async assertCanSubmit(slug: string, authorization?: string) {
    const inv = await this.prisma.invitation.findUnique({
      where: { slug },
      select: { accessMode: true },
    });
    if (!inv) throw new NotFoundException(`Invitation "${slug}" not found`);

    if (inv.accessMode === AccessMode.PIN && !this.isUnlocked(slug, authorization)) {
      throw new HttpException(
        'Απαιτείται κωδικός πρόσκλησης.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private enforceRateLimit(key: string) {
    const now = Date.now();
    const recent = (this.attempts.get(key) ?? []).filter(
      (t) => now - t < WINDOW_MS,
    );

    if (recent.length >= MAX_ATTEMPTS) {
      this.logger.warn(`Unlock rate limit hit for ${key}`);
      throw new HttpException(
        'Πολλές προσπάθειες. Δοκιμάστε ξανά σε λίγο.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.attempts.set(key, recent);

    if (this.attempts.size > 5000) {
      for (const [k, times] of this.attempts) {
        if (times.every((t) => now - t >= WINDOW_MS)) this.attempts.delete(k);
      }
    }
  }
}
