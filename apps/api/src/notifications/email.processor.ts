import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { EMAIL_QUEUE } from '../common/queue/email-queue.constants';

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    this.logger.debug(`Processing email job ${job.id} for ${job.data.to} (Attempt ${job.attemptsMade + 1})`);
    
    try {
      await this.emailService.sendNotificationEmail(
        job.data.to,
        job.data.subject,
        job.data.html,
      );
      this.logger.log(`Email job ${job.id} completed successfully.`);
    } catch (error) {
      this.logger.error(`Failed to process email job ${job.id}: ${(error as Error).message}`, (error as Error).stack);
      throw error; // Let BullMQ handle the retry mechanism
    }
  }
}
