import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserRepository } from './repositories/user.repository';
import { PasswordHasher } from './services/password-hasher.service';
import { UserService } from './services/user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, PasswordHasher],
  exports: [UserService, UserRepository, PasswordHasher],
})
export class UsersModule {}
