import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './task.schema';
import { Organization, OrganizationSchema } from '../organizations/organization.schema';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    AuditModule,
  ],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
