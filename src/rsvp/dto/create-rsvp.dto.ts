import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
export enum DietaryType {
  NONE = 'NONE',
  VEGAN = 'VEGAN',
  VEGETARIAN = 'VEGETARIAN',
}

export class CreateRsvpDto {
  @ApiProperty()
  @IsString()
  guestName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty()
  @IsBoolean()
  attending!: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  adultCount?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasChildren?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  childCount?: number;

  @ApiPropertyOptional({ enum: DietaryType, default: DietaryType.NONE })
  @IsOptional()
  @IsEnum(DietaryType)
  dietary?: DietaryType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasAllergy?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  allergyNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}
