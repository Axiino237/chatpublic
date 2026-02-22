import { IsEmail, IsNotEmpty, IsString, MinLength, IsDateString, Matches } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers and underscores' })
  username: string;


  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character' })
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsString()
  @IsNotEmpty()
  gender: string;
}
