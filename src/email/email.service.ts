import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get<string>('EMAIL_USER'),
        pass: this.config.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendRsvpNotification(opts: {
    coupleEmail: string;
    coupleName: string;
    guestName: string;
    attending: boolean;
    adultCount: number;
    hasChildren: boolean;
    childCount: number;
    dietary: string;
    hasAllergy: boolean;
    allergyNote?: string;
    message?: string;
  }) {
    const status = opts.attending ? '✅ Θα παραστεί' : '❌ Δεν θα παραστεί';
    const html = `
      <h2>Νέο RSVP για ${opts.coupleName}</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px">
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Καλεσμένος</strong></td><td style="padding:8px;border:1px solid #ddd">${opts.guestName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Παρουσία</strong></td><td style="padding:8px;border:1px solid #ddd">${status}</td></tr>
        ${opts.attending ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Ενήλικες</strong></td><td style="padding:8px;border:1px solid #ddd">${opts.adultCount}</td></tr>` : ''}
        ${opts.hasChildren ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Παιδιά</strong></td><td style="padding:8px;border:1px solid #ddd">${opts.childCount}</td></tr>` : ''}
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Διατροφή</strong></td><td style="padding:8px;border:1px solid #ddd">${opts.dietary}</td></tr>
        ${opts.hasAllergy ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Αλλεργία</strong></td><td style="padding:8px;border:1px solid #ddd">${opts.allergyNote ?? '-'}</td></tr>` : ''}
        ${opts.message ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Μήνυμα</strong></td><td style="padding:8px;border:1px solid #ddd">${opts.message}</td></tr>` : ''}
      </table>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Invitations Platform" <${this.config.get('EMAIL_USER')}>`,
        to: opts.coupleEmail,
        subject: `Νέο RSVP από ${opts.guestName}`,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send RSVP email: ${err}`);
    }
  }
}
