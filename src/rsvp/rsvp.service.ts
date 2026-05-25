import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactRole } from '@prisma/client';
import { DietaryType } from './dto/create-rsvp.dto';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRsvpDto } from './dto/create-rsvp.dto';

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
    if (!invitation) throw new NotFoundException(`Invitation "${slug}" not found`);

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
      ? await this.prisma.rSVP.update({ where: { id: existing.id }, data: rsvpData })
      : await this.prisma.rSVP.create({ data: rsvpData });

    // Notify both bride and groom by email
    const emailContacts = invitation.contacts.filter(
      (c) =>
        (c.role === ContactRole.BRIDE || c.role === ContactRole.GROOM) &&
        c.email,
    );

    const coupleName = `${invitation.brideName} & ${invitation.groomName}`;
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
