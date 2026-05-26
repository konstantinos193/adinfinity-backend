import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ContactRole, EventType, InvitationType } from '@prisma/client';

class CreateEventDto {
  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  mapsUrl?: string;
}

class CreateContactDto {
  @ApiProperty({ enum: ContactRole })
  @IsEnum(ContactRole)
  role: ContactRole;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;
}

class CreateGiftDto {
  @ApiProperty()
  @IsString()
  ownerName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty()
  @IsString()
  iban: string;
}

export class CreateInvitationDto {
  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsString()
  brideName: string;

  @ApiProperty()
  @IsString()
  groomName: string;

  @ApiProperty()
  @IsDateString()
  weddingDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  story?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  coverImages?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  galleryImages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fontColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backgroundStyle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  musicUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  rsvpDeadline?: string;

  @ApiPropertyOptional({ enum: InvitationType })
  @IsOptional()
  @IsEnum(InvitationType)
  invitationType?: InvitationType;

  @ApiPropertyOptional({ type: [CreateEventDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventDto)
  events?: CreateEventDto[];

  @ApiPropertyOptional({ type: [CreateContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  contacts?: CreateContactDto[];

  @ApiPropertyOptional({ type: [CreateGiftDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGiftDto)
  giftRegistries?: CreateGiftDto[];
}
