import { PartialType } from '@nestjs/mapped-types';
import { LogInAuthDto } from './login-auth.dto';

export class UpdateAuthDto extends PartialType(LogInAuthDto) {}
