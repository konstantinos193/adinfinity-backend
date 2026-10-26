import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactRole, EventCategory } from '@prisma/client';
import { DietaryType } from './dto/create-rsvp.dto';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRsvpDto } from './dto/create-rsvp.dto';

/**
 * Contacts who own the event and should hear about every RSVP. Deliberately
 * excludes BEST_MAN and MAID_OF_HONOR — they are listed on the invitation as
 * people to call, not as the people collecting replies.
 */
const HOST_ROLES: ContactRole[] = [
  ContactRole.BRIDE,
  ContactRole.GROOM,
  ContactRole.FATHER,
  ContactRole.MOTHER,
  ContactRole.GODFATHER,
  ContactRole.GODMOTHER,
  ContactRole.HOST,
];

@Injectable()
export class RsvpService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async submit(slug: string, dto: CreateRsvpDto) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { slug },
      include: { contacts: true },
    });
    if (!invitation)
      throw new NotFoundException(`Invitation "${slug}" not found`);

    const rsvpData = {
      invitationId: invitation.id,
      guestName: dto.guestName,
      phone: dto.phone || null,
      attending: dto.attending,
      adultCount: dto.adultCount ?? 1,
      hasChildren: dto.hasChildren ?? false,
      childCount: dto.childCount ?? 0,
      dietary: (dto.dietary as any) ?? 'NONE',
      hasAllergy: dto.hasAllergy ?? false,
      allergyNote: dto.allergyNote ?? null,
      message: dto.message ?? null,
    };

    // Dedup by phone: if the same phone submits again, update their response
    const phone = dto.phone?.trim();
    const existing = phone
      ? await this.prisma.rSVP.findFirst({
          where: { invitationId: invitation.id, phone },
        })
      : null;

    const rsvp = existing
      ? await this.prisma.rSVP.update({
          where: { id: existing.id },
          data: rsvpData,
        })
      : await this.prisma.rSVP.create({ data: rsvpData });

    // Notify whoever is hosting this event. Filtering on BRIDE/GROOM alone
    // meant a baptism or birthday invitation notified nobody, since those
    // carry FATHER/MOTHER/GODPARENT/HOST contacts instead.
    const hosts = invitation.contacts.filter(
      (c) => c.email && HOST_ROLES.includes(c.role),
    );
    // Any other contact with an address is better than telling no one.
    const emailContacts = hosts.length
      ? hosts
      : invitation.contacts.filter((c) => c.email);

    const coupleName = describeInvitation(invitation);
    for (const contact of emailContacts) {
      await this.email.sendRsvpNotification({
        coupleEmail: contact.email!,
        coupleName,
        guestName: dto.guestName,
        attending: dto.attending,
        adultCount: dto.adultCount ?? 1,
        hasChildren: dto.hasChildren ?? false,
        childCount: dto.childCount ?? 0,
        dietary: dto.dietary ?? 'NONE',
        hasAllergy: dto.hasAllergy ?? false,
        allergyNote: dto.allergyNote,
        message: dto.message,
      });
    }

    return rsvp;
  }
}

/**
 * Subject line / greeting name for the event. "Bride & Groom" only reads
 * correctly for a wedding; every other category keeps its own names, and
 * without this a baptism went out as "null & null".
 */
function describeInvitation(invitation: {
  eventCategory: EventCategory;
  brideName: string | null;
  groomName: string | null;
  childName: string | null;
  honoreeName: string | null;
  hostName: string | null;
  eventTitle: string | null;
}): string {
  const couple = [invitation.brideName, invitation.groomName]
    .filter(Boolean)
    .join(' & ');

  switch (invitation.eventCategory) {
    case EventCategory.WEDDING:
      return couple;
    case EventCategory.BAPTISM:
      return invitation.childName ?? couple;
    case EventCategory.WEDDING_BAPTISM:
      return [couple, invitation.childName].filter(Boolean).join(' — ');
    default:
      return (
        invitation.honoreeName ??
        invitation.hostName ??
        invitation.eventTitle ??
        couple
      );
  }
}
