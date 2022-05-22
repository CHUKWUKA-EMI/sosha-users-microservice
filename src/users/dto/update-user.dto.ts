import {
  IsAlpha,
  IsDateString,
  IsEmail,
  IsEnum,
  IsISO31661Alpha2,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { GENDER } from '../enums/enums';

export class UpdateUserDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsOptional()
  @IsAlpha()
  firstName?: string;

  @IsOptional()
  @IsAlpha()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsUrl()
  imgUrl?: string;

  @IsOptional()
  @IsString()
  imagekit_fileId?: string;

  @IsOptional()
  @IsDateString()
  birthdate?: Date;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsISO31661Alpha2()
  country?: string;

  @IsOptional()
  @IsAlpha()
  state?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsEnum(GENDER)
  sex?: GENDER;

  @IsOptional()
  @IsOptional()
  username?: string;
}
