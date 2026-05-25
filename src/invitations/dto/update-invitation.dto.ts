import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { InvitationStatus, InvitationType } from '@prisma/client';
import { CreateInvitationDto } from './create-invitation.dto';

export class UpdateInvitationDto extends PartialType(CreateInvitationDto) {
  @IsOptional()
  @IsEnum(InvitationStatus)
  status?: InvitationStatus;

  @IsOptional()
  @IsEnum(InvitationType)
  invitationType?: InvitationType;
}
