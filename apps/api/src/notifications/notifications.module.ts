import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { NotificationsListener } from './notifications.listener';
import { NotificationsScheduler } from './notifications.scheduler';
import {
  EMAIL_QUEUE,
  EMAIL_QUEUE_DEFAULT_JOB_OPTIONS,
} from '../common/queue/email-queue.constants';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
    ConfigModule,
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
      defaultJobOptions: EMAIL_QUEUE_DEFAULT_JOB_OPTIONS,
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    EmailService,
    EmailProcessor,
    NotificationsListener,
    NotificationsScheduler,
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
