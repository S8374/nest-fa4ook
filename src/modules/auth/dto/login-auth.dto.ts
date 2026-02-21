import { IsEmail, IsNotEmpty } from 'class-validator';
export class LogInAuthDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
