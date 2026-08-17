import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const INVITATION_TYPES = [
  'MINI_WEBSITE',
  'VIDEO_PROSKLITIRIO',
  'VIDEO',
  'UNSURE',
] as const;

export type RequestedInvitationType = (typeof INVITATION_TYPES)[number];

export class CreateLeadDto {
  @ApiProperty({ example: 'Ιωάννα & Αλέξανδρος' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  coupleName: string;

  @ApiProperty({ example: 'ioanna@example.com' })
  @IsEmail()
  @MaxLength(160)
  email: string;

  @ApiPropertyOptional({ example: '+30 691 234 5678' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  /** Kept as a plain string: couples often know only the month. */
  @ApiPropertyOptional({ example: '2027-06-15' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  eventDate?: string;

  @ApiProperty({ enum: INVITATION_TYPES })
  @IsIn(INVITATION_TYPES as unknown as string[])
  invitationType: RequestedInvitationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  /**
   * Honeypot. Real users never see this field, so anything in it is a bot.
   * Named innocuously because scrapers fill fields called "website"/"url".
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}