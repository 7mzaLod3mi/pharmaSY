export const EMAIL_QUEUE = 'email-queue';

export const EMAIL_QUEUE_DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: {
    type: 'exponential' as const,
    delay: 2_000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};
