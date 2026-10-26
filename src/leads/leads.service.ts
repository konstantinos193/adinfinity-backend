import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async submit(dto: CreateLeadDto) {
    // Honeypot tripped — accept silently so the bot sees a success and stops
    // retrying, but do nothing.
    if (dto.website) {
      this.logger.warn('Discarded lead: honeypot field populated');
      return { ok: true };
    }

    // Leads are emailed rather than persisted on purpose: adding a Prisma model
    // would need a migration, and this project's deploy.sh does not run them.
    // That makes the recipient the only copy there is, so it must be a mailbox
    // someone actually reads — not EMAIL_USER, which is the sending account.
    const to =
      this.config.get<string>('LEADS_EMAIL') ?? 'manos@adinfinity.gr';

    await this.email.sendLeadNotification({ to, ...dto });
    return { ok: true };
  }
}
