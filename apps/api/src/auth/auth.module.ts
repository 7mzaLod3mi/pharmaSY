import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { BullModule } from '@nestjs/bullmq';
import {
  EMAIL_QUEUE,
  EMAIL_QUEUE_DEFAULT_JOB_OPTIONS,
} from '../common/queue/email-queue.constants';

@Module({
  imports: [
    UsersModule,
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
      defaultJobOptions: EMAIL_QUEUE_DEFAULT_JOB_OPTIONS,
    }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'pharmasyn-dev-secret'),
        signOptions: {
          expiresIn: config.get('JWT_ACCESS_EXPIRY', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
