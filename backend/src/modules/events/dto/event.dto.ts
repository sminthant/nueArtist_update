import {
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEventDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Please enter the event name.' })
  @MaxLength(255, { message: 'Event name may not be longer than 255 characters.' })
  event_name!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Please enter the venue.' })
  @MaxLength(255, { message: 'Venue may not be longer than 255 characters.' })
  venue!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Please enter the location.' })
  @MaxLength(255)
  location!: string;

  @IsDateString({}, { message: 'Please enter the event date and time.' })
  event_date!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Please enter the booking URL.' })
  @IsUrl({}, { message: 'Please enter a valid booking URL.' })
  @MaxLength(255)
  booking_url!: string;
}

export class UpdateEventDto extends CreateEventDto {}
