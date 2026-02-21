import { Exclude } from 'class-transformer';
import { Role, UserStatus } from 'src/generated/prisma/enums';

export class UserEntity {
  id: string;

  fullName: string | null;

  email: string;

  @Exclude()
  password: string | null; // Changed to allow null

  role: Role;

  status: UserStatus;

  isVerified: boolean;

  createdAt: Date;

  updatedAt: Date;

  // Optional fields that might be needed
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  nationality?: string | null;
  verifiedAt?: Date | null;
  lastLogin?: Date | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}