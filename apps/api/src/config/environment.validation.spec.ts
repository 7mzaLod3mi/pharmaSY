import { validateEnvironment } from './environment.validation';

describe('validateEnvironment', () => {
  it('requires a database URL in every environment', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'test' })).toThrow(
      'Missing required environment variables: DATABASE_URL',
    );
  });

  it('rejects missing production JWT secrets', () => {
    expect(() =>
      validateEnvironment({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://db' }),
    ).toThrow('JWT_SECRET, JWT_REFRESH_SECRET');
  });

  it('requires Resend delivery configuration in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://db',
        JWT_SECRET: 'production-access-secret',
        JWT_REFRESH_SECRET: 'production-refresh-secret',
      }),
    ).toThrow('RESEND_API_KEY, RESEND_FROM_EMAIL, FRONTEND_URL');
  });

  it('rejects development JWT secrets in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://db',
        JWT_SECRET: 'pharmasyn-dev-secret',
        JWT_REFRESH_SECRET: 'pharmasyn-dev-refresh-secret',
        RESEND_API_KEY: 're_test',
        RESEND_FROM_EMAIL: 'verified@example.com',
        FRONTEND_URL: 'https://app.example.com',
      }),
    ).toThrow('Development JWT secrets are forbidden in production');
  });
});
