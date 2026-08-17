import { Injectable, NotFoundException } from '@nestjs/common';
import { AccessMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { InvitationAccessService } from './invitation-access.service';

const INVITATION_INCLUDE = {
  events: true,
  contacts: true,
  giftRegistries: true,
  _count: { select: { rsvps: true } },
} as const;

/**
 * Replaces the stored PIN hash with a boolean before anything leaves the API.
 * Admin needs to know whether a PIN is set, never what it is — changing one is
 * a replacement, not an edit.
 */
function stripPin<T extends { accessPin?: string | null }>(inv: T) {
  const { accessPin, ...rest } = inv;
  return { ...rest, hasPin: Boolean(accessPin) };
}

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private access: InvitationAccessService,
  ) {}

  async create(dto: CreateInvitationDto) {
    const { events, contacts, giftRegistries, accessPin, ...rest } = dto;
    return this.prisma.invitation.create({
      data: {
        ...rest,
        // Stored hashed; the plaintext never touches the database.
        accessPin: await this.access.hashPin(accessPin),
        weddingDate: rest.weddingDate ? new Date(rest.weddingDate) : undefined,
        rsvpDeadline: rest.rsvpDeadline
          ? new Date(rest.rsvpDeadline)
          : undefined,
        events: events
          ? { create: events.map((e) => ({ ...e, date: new Date(e.date) })) }
          : undefined,
        contacts: contacts ? { create: contacts } : undefined,
        giftRegistries: giftRegistries ? { create: giftRegistries } : undefined,
      },
      include: INVITATION_INCLUDE,
    });
  }

  async findAll() {
    const list = await this.prisma.invitation.findMany({
      include: INVITATION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return list.map(stripPin);
  }

  /**
   * Public read.
   *
   * When the invitation is PIN-protected and the caller hasn't unlocked it,
   * this returns a stub with no personal data at all. The filtering happens
   * here rather than in the frontend on purpose: hiding fields client-side
   * would still ship the couple's phone numbers and IBAN to the browser.
   */
  async findBySlug(slug: string, unlocked = false) {
    const inv = await this.prisma.invitation.findUnique({
      where: { slug },
      include: INVITATION_INCLUDE,
    });
    if (!inv) throw new NotFoundException(`Invitation "${slug}" not found`);

    if (inv.accessMode === AccessMode.PIN && !unlocked) {
      return {
        slug: inv.slug,
        accessMode: inv.accessMode,
        locked: true as const,
        invitationType: inv.invitationType,
      };
    }

    // Never expose the hash, even to an unlocked guest.
    const { accessPin: _accessPin, ...safe } = inv;
    return { ...safe, locked: false as const };
  }

  async findOne(id: string) {
    const inv = await this.prisma.invitation.findUnique({
      where: { id },
      include: INVITATION_INCLUDE,
    });
    if (!inv) throw new NotFoundException(`Invitation "${id}" not found`);
    return stripPin(inv);
  }

  async update(id: string, dto: UpdateInvitationDto) {
    await this.findOne(id);
    const { events, contacts, giftRegistries, accessPin, ...rest } = dto;
    return this.prisma.invitation.update({
      where: { id },
      data: {
        ...rest,
        // undefined = leave the existing PIN alone; '' = clear it.
        ...(accessPin !== undefined && {
          accessPin: await this.access.hashPin(accessPin),
        }),
        weddingDate: rest.weddingDate ? new Date(rest.weddingDate) : undefined,
        rsvpDeadline:
          rest.rsvpDeadline !== undefined
            ? rest.rsvpDeadline
              ? new Date(rest.rsvpDeadline)
              : null
            : undefined,
        // If arrays provided: wipe + recreate (simplest safe approach)
        ...(events !== undefined && {
          events: {
            deleteMany: {},
            create: events.map((e) => ({ ...e, date: new Date(e.date) })),
          },
        }),
        ...(contacts !== undefined && {
          contacts: { deleteMany: {}, create: contacts },
        }),
        ...(giftRegistries !== undefined && {
          giftRegistries: { deleteMany: {}, create: giftRegistries },
        }),
      },
      include: INVITATION_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.invitation.delete({ where: { id } });
  }

  async getRsvps(id: string) {
    await this.findOne(id);
    return this.prisma.rSVP.findMany({
      where: { invitationId: id },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
