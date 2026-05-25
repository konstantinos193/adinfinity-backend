import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';

const INVITATION_INCLUDE = {
  events: true,
  contacts: true,
  giftRegistries: true,
  _count: { select: { rsvps: true } },
} as const;

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInvitationDto) {
    const { events, contacts, giftRegistries, ...rest } = dto;
    return this.prisma.invitation.create({
      data: {
        ...rest,
        weddingDate: new Date(rest.weddingDate),
        rsvpDeadline: rest.rsvpDeadline ? new Date(rest.rsvpDeadline) : undefined,
        events: events ? { create: events.map((e) => ({ ...e, date: new Date(e.date) })) } : undefined,
        contacts: contacts ? { create: contacts } : undefined,
        giftRegistries: giftRegistries ? { create: giftRegistries } : undefined,
      },
      include: INVITATION_INCLUDE,
    });
  }

  async findAll() {
    return this.prisma.invitation.findMany({
      include: INVITATION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const inv = await this.prisma.invitation.findUnique({
      where: { slug },
      include: INVITATION_INCLUDE,
    });
    if (!inv) throw new NotFoundException(`Invitation "${slug}" not found`);
    return inv;
  }

  async findOne(id: string) {
    const inv = await this.prisma.invitation.findUnique({
      where: { id },
      include: INVITATION_INCLUDE,
    });
    if (!inv) throw new NotFoundException(`Invitation "${id}" not found`);
    return inv;
  }

  async update(id: string, dto: UpdateInvitationDto) {
    await this.findOne(id);
    const { events, contacts, giftRegistries, ...rest } = dto;
    return this.prisma.invitation.update({
      where: { id },
      data: {
        ...rest,
        weddingDate: rest.weddingDate ? new Date(rest.weddingDate) : undefined,
        rsvpDeadline: rest.rsvpDeadline !== undefined
          ? (rest.rsvpDeadline ? new Date(rest.rsvpDeadline) : null)
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
