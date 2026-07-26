export function validateEnvironment(config: Record<string, unknown>) {
  const readString = (key: string, fallback = ''): string => {
    const value = config[key];
    return typeof value === 'string' ? value : fallback;
  };
  const nodeEnv = readString('NODE_ENV', 'development');
  const required = ['DATABASE_URL'];

  if (nodeEnv === 'production') {
    required.push(
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'RESEND_API_KEY',
      'RESEND_FROM_EMAIL',
      'FRONTEND_URL',
    );
  }

  const missing = required.filter((key) => !readString(key).trim());
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  if (
    nodeEnv === 'production' &&
    (config.JWT_SECRET === 'pharmasyn-dev-secret' ||
      config.JWT_REFRESH_SECRET === 'pharmasyn-dev-refresh-secret')
  ) {
    throw new Error('Development JWT secrets are forbidden in production');
  }

  if (
    config.RESEND_FROM_EMAIL &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(readString('RESEND_FROM_EMAIL'))
  ) {
    throw new Error('RESEND_FROM_EMAIL must be a valid email address');
  }

  return config;
}
