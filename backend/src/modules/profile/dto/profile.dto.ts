import {
  IsEmail,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

export class DeleteProfileDto {
  @IsString({ message: 'The password field is required.' })
  password!: string;
}
