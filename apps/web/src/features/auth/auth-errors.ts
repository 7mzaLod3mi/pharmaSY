import { type ApiError, normalizeApiError } from "@/lib/http-client";

type Translate = (key: string) => string;

const errorCodeKeys: Record<string, string> = {
  INVALID_CREDENTIALS: "auth.error.invalidCredentials",
  EMAIL_NOT_VERIFIED: "auth.state.emailNotVerified",
  ORGANIZATION_PENDING: "auth.state.organizationPending",
  ORGANIZATION_REJECTED: "auth.state.organizationRejected",
  ACCOUNT_SUSPENDED: "auth.state.accountSuspended",
  ACCOUNT_BANNED: "auth.state.accountBanned",
  ACCOUNT_NOT_ACTIVE: "auth.error.accountNotActive",
  EMAIL_DELIVERY_NOT_CONFIGURED: "auth.error.emailDeliveryNotConfigured",
  VALIDATION_ERROR: "auth.error.validation",
  network_error: "auth.error.network",
};

const validationMessageKeys: Array<[RegExp, string]> = [
  [/email must be an email/i, "auth.error.emailInvalid"],
  [/password must be longer than or equal to 8 characters/i, "auth.error.passwordLength"],
  [/password must contain uppercase, lowercase, and numeric characters/i, "auth.error.passwordComplexity"],
  [/invalid syrian phone number/i, "auth.error.phoneInvalid"],
  [/firstName must be longer than or equal to 2 characters/i, "auth.error.firstNameLength"],
  [/lastName must be longer than or equal to 2 characters/i, "auth.error.lastNameLength"],
  [/otp must be longer than or equal to 6 characters/i, "auth.error.otpInvalid"],
  [/otp must be shorter than or equal to 6 characters/i, "auth.error.otpInvalid"],
  [/otp must match/i, "auth.error.otpInvalid"],
  [/invalid or expired verification code/i, "auth.error.otpExpired"],
  [/email already in use/i, "auth.error.emailInUse"],
];

export function localizedAuthError(
  unknownError: unknown,
  t: Translate,
): { error: ApiError; message: string } {
  const error = normalizeApiError(unknownError);
  const validationMessage =
    Object.values(error.fieldErrors ?? {}).flat()[0] ?? error.message;
  const validationKey = validationMessageKeys.find(([pattern]) =>
    pattern.test(validationMessage),
  )?.[1];
  const codeKey = errorCodeKeys[error.code];
  const key = validationKey ?? codeKey;

  return {
    error,
    message: key ? t(key) : error.message,
  };
}
