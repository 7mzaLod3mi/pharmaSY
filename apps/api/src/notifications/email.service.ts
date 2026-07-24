import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private fromEmail: string;
  private fromName: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY', '');
    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL', 'noreply@pharmasyn.com');
    this.fromName = this.configService.get<string>('RESEND_FROM_NAME', 'PharmaSY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else if (this.configService.get<string>('NODE_ENV') !== 'test') {
      this.logger.warn(
        'RESEND_API_KEY is not configured. Email jobs will fail until delivery is configured.',
      );
    }
  }

  async sendNotificationEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    if (!this.resend) {
      if (this.configService.get<string>('NODE_ENV') === 'test') return;
      throw new Error('Email delivery is not configured: RESEND_API_KEY is missing');
    }

    try {
      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to,
        subject,
        html,
      });
      if (result.error) {
        throw new Error(`Resend rejected the email: ${result.error.message}`);
      }
      if (!result.data?.id) {
        throw new Error('Resend did not return an email delivery id');
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }
}
