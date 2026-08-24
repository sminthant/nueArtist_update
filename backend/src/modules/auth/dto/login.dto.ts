import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { toBoolean } from '../../../common/validators/transform-boolean.util';

export class LoginDto {
  @IsEmail({}, { message: 'The email field must be a valid email address.' })
  email!: string;

  @IsString({ message: 'The password field is required.' })
  password!: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value, false))
  @IsBoolean()
  remember?: boolean;
}
