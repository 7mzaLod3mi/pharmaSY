// ─── Constants ─────────────────────────────────────────────────────────────────

export const APP_NAME = 'PharmaSY';
export const APP_VERSION = '1.0.0';

export const COUNTRY = {
  code: 'SY',
  name: 'Syria',
  phonePrefix: '+963',
  currency: 'SYP',
  currencySymbol: 'ل.س',
  locale: 'ar-SY',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const SYNC_INTERVALS = {
  PRODUCTS_MS: 10 * 60 * 1000,    // 10 minutes
  CATEGORIES_MS: 30 * 60 * 1000,  // 30 minutes
};

export const JWT = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
};

export const ORDER_PREFIXES = {
  ORDER: 'PSY',
  CHECKOUT: 'CHK',
};

export const STOCK = {
  DEFAULT_MIN_STOCK: 5,
  EXPIRY_WARNING_DAYS: 90,  // warn 90 days before expiry
};

export const UPLOAD = {
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXCEL_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ],
};

export const CACHE_KEYS = {
  SEARCH_POPULAR: 'search:popular',
  SEARCH_RECENT: (userId: string) => `search:recent:${userId}`,
  CATEGORIES_TREE: 'categories:tree',
  PRODUCT: (id: string) => `product:${id}`,
};

export const SOCKET_ROOMS = {
  USER: (userId: string) => `user:${userId}`,
  PHARMACY: (pharmacyId: string) => `pharmacy:${pharmacyId}`,
  SUPPLIER: (supplierId: string) => `supplier:${supplierId}`,
  ADMIN: 'admin',
};

// ─── Formatting Utilities ──────────────────────────────────────────────────────

/**
 * Format currency in Syrian Pounds
 */
export function formatCurrency(amount: number, locale: 'ar' | 'en' = 'ar'): string {
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-SY' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return locale === 'ar' ? `${formatted} ل.س` : `SYP ${formatted}`;
}

/**
 * Format a date in the given locale
 */
export function formatDate(date: string | Date, locale: 'ar' | 'en' = 'ar'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Format a date with time
 */
export function formatDateTime(date: string | Date, locale: 'ar' | 'en' = 'ar'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Generate a human-readable order number
 * Format: PSY-YYYY-NNNNNN
 */
export function formatOrderNumber(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${String(sequence).padStart(6, '0')}`;
}

/**
 * Get product display name based on locale
 */
export function getProductName(
  product: { tradeNameAr: string; tradeNameEn: string },
  locale: 'ar' | 'en' = 'ar'
): string {
  return locale === 'ar' ? product.tradeNameAr : product.tradeNameEn;
}

/**
 * Get category display name based on locale
 */
export function getCategoryName(
  category: { nameAr: string; nameEn: string },
  locale: 'ar' | 'en' = 'ar'
): string {
  return locale === 'ar' ? category.nameAr : category.nameEn;
}

// ─── Validation Utilities ──────────────────────────────────────────────────────

/**
 * Validate Syrian phone number (e.g. 09XXXXXXXX)
 */
export function isValidSyrianPhone(phone: string): boolean {
  return /^(09\d{8}|\+9639\d{8})$/.test(phone.replace(/\s/g, ''));
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Array / Object Utilities ──────────────────────────────────────────────────

/**
 * Group an array of objects by a key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) result[groupKey] = [];
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Chunk an array into groups of n
 */
export function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      if (key in obj) acc[key] = obj[key];
      return acc;
    },
    {} as Pick<T, K>
  );
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result as Omit<T, K>;
}

// ─── String Utilities ──────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

// ─── Type Guards ───────────────────────────────────────────────────────────────

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
