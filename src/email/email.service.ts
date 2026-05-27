import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('EMAIL_HOST', 'mail.adinfinity.gr'),
      port: this.config.get<number>('EMAIL_PORT', 465),
      secure: true,
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
    const html = buildRsvpEmailHtml(opts);

    try {
      await this.transporter.sendMail({
        from: `"${this.config.get('EMAIL_FROM_NAME', 'Invitations Platform')}" <${this.config.get('EMAIL_USER')}>`,
        to: opts.coupleEmail,
        subject: `Νέο RSVP από ${opts.guestName}`,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send RSVP email: ${err}`);
    }
  }
}

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:12px 24px;border-bottom:1px solid #efe8de;width:38%;font-size:11px;font-weight:600;color:#b8960c;text-transform:uppercase;letter-spacing:0.08em;vertical-align:middle;font-family:'Inter',Arial,sans-serif">${label}</td>
      <td style="padding:12px 24px;border-bottom:1px solid #efe8de;font-size:15px;color:#2c1810;vertical-align:middle;font-family:'Inter',Arial,sans-serif">${value}</td>
    </tr>`;
}

function buildRsvpEmailHtml(opts: {
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
  const dietaryLabel: Record<string, string> = {
    NONE: 'Κανένας περιορισμός',
    VEGAN: 'Vegan',
    VEGETARIAN: 'Χορτοφάγος',
  };

  const attendingBadge = opts.attending
    ? `<span style="display:inline-block;background:#f0f7ee;color:#3a6b2a;padding:4px 14px;border-radius:20px;font-size:13px;font-family:'Inter',Arial,sans-serif;font-weight:600;border:1px solid #c4dfc0">✓ &nbsp;Θα παραστεί</span>`
    : `<span style="display:inline-block;background:#fdf0f2;color:#8b2635;padding:4px 14px;border-radius:20px;font-size:13px;font-family:'Inter',Arial,sans-serif;font-weight:600;border:1px solid #e8c0c6">✗ &nbsp;Δεν θα παραστεί</span>`;

  const rows = [
    row('Καλεσμένος', opts.guestName),
    row('Παρουσία', attendingBadge),
    ...(opts.attending
      ? [
          row('Ενήλικες', String(opts.adultCount)),
          row('Παιδιά', String(opts.childCount)),
          row('Διατροφή', dietaryLabel[opts.dietary] ?? opts.dietary),
          ...(opts.hasAllergy
            ? [row('Αλλεργία', opts.allergyNote ?? '—')]
            : []),
        ]
      : []),
  ].join('');

  const messageBlock =
    opts.attending && opts.message
      ? `<tr><td style="padding:20px 24px 24px">
          <p style="margin:0 0 10px;font-size:11px;font-weight:600;color:#b8960c;text-transform:uppercase;letter-spacing:0.08em;font-family:'Inter',Arial,sans-serif">Μήνυμα</p>
          <blockquote style="margin:0;padding:16px 20px;background:#fdfaf6;border-left:3px solid #b8960c;border-radius:0 4px 4px 0;font-size:15px;color:#2c1810;font-family:'Playfair Display',Georgia,serif;font-style:italic;line-height:1.7;word-break:break-word">${opts.message}</blockquote>
        </td></tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;600&display=swap&subset=greek" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#fdfaf6;font-family:'Inter',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdfaf6;padding:48px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px">

        <!-- Logo / Brand -->
        <tr><td style="text-align:center;padding-bottom:28px">
          <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#b8960c;font-family:'Inter',Arial,sans-serif;font-weight:600">adinfinity invitations</p>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border:1px solid #efe8de;border-radius:4px;overflow:hidden">

          <!-- Card Header -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:32px 24px 24px;text-align:center;border-bottom:1px solid #efe8de">
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#c9748a;font-family:'Inter',Arial,sans-serif;font-weight:600">Νέα Απάντηση RSVP</p>
              <h1 style="margin:0;font-size:28px;font-weight:400;color:#2c1810;font-family:'Playfair Display',Georgia,serif;font-style:italic;letter-spacing:0.01em">${opts.coupleName}</h1>
              <!-- Gold divider -->
              <div style="margin:16px auto 0;width:60px;height:1px;background:linear-gradient(90deg,transparent,#b8960c,transparent)"></div>
            </td></tr>

            <!-- Rows -->
            <tr><td>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${rows}
                ${messageBlock}
              </table>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0;text-align:center">
          <p style="margin:0;font-size:10px;color:#c9b8a8;letter-spacing:0.14em;text-transform:uppercase;font-family:'Inter',Arial,sans-serif">adinfinity &nbsp;·&nbsp; Invitations Platform</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
