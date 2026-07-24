import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  function createService(nodeEnv = 'test') {
    const values: Record<string, string> = {
      NODE_ENV: nodeEnv,
      RESEND_API_KEY: 're_test',
      RESEND_FROM_EMAIL: 'verified@example.com',
      RESEND_FROM_NAME: 'PharmaSY',
    };
    return new EmailService({
      get: (key: string, fallback?: string) => values[key] ?? fallback,
    } as ConfigService);
  }

  it('accepts a Resend delivery only when an id is returned', async () => {
    const service = createService();
    const send = jest.fn().mockResolvedValue({
      data: { id: 'email-1' },
      error: null,
    });
    (service as unknown as { resend: unknown }).resend = { emails: { send } };

    await expect(
      service.sendNotificationEmail(
        'owner@example.com',
        'Verify',
        '<p>123456</p>',
      ),
    ).resolves.toBeUndefined();
  });

  it('throws when Resend returns an error object instead of rejecting', async () => {
    const service = createService();
    (service as unknown as { resend: unknown }).resend = {
      emails: {
        send: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Domain is not verified' },
        }),
      },
    };

    await expect(
      service.sendNotificationEmail(
        'owner@example.com',
        'Verify',
        '<p>123456</p>',
      ),
    ).rejects.toThrow('Resend rejected the email: Domain is not verified');
  });

  it('fails clearly outside tests when RESEND_API_KEY is missing', async () => {
    const service = new EmailService({
      get: (key: string, fallback?: string) =>
        key === 'NODE_ENV' ? 'development' : fallback,
    } as ConfigService);

    await expect(
      service.sendNotificationEmail(
        'owner@example.com',
        'Verify',
        '<p>123456</p>',
      ),
    ).rejects.toThrow('RESEND_API_KEY is missing');
  });
});
