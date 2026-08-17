import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UnlockInvitationDto {
  @ApiProperty({ example: '1234' })
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  pin: string;
}
