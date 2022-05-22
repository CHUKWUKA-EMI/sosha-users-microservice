import {
  IsAlpha,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsAlpha()
  @IsNotEmpty()
  firstName: string;

  @IsAlpha()
  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsAlpha()
  country?: string;

  @IsOptional()
  @IsAlpha()
  state?: string;

  @IsOptional()
  @IsDateString()
  birthdate?: Date;

  @IsNotEmpty()
  @IsString()
  username: string;
}
