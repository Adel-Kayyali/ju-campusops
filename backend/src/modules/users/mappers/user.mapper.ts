import { User } from '@prisma/client';
import { UserResponseDto, UserSummaryDto } from '../dto/user.dto';

export class UserMapper {
  static toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      universityId: user.universityId,
      phone: user.phone,
      department: user.department,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  static toSummary(user: Pick<User, 'id' | 'fullName' | 'universityId'> & { email?: string }): UserSummaryDto {
    return { id: user.id, fullName: user.fullName, universityId: user.universityId, email: user.email };
  }
}
