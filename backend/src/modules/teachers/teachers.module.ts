import { Module } from '@nestjs/common';
import { TeacherController } from './controllers/teacher.controller';
import { TeacherRepository } from './repositories/teacher.repository';
import { TeacherService } from './services/teacher.service';

@Module({
  controllers: [TeacherController],
  providers: [TeacherService, TeacherRepository],
})
export class TeachersModule {}
