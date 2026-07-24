// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MERGED = 'MERGED',
}

export enum OrgStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PHARMACY = 'PHARMACY',
  SUPPLIER = 'SUPPLIER',
}

export enum AccountVerificationState {
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ORGANIZATION_PROFILE_REQUIRED = 'ORGANIZATION_PROFILE_REQUIRED',
  ORGANIZATION_PENDING = 'ORGANIZATION_PENDING',
  ORGANIZATION_REJECTED = 'ORGANIZATION_REJECTED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_BANNED = 'ACCOUNT_BANNED',
  ACTIVE = 'ACTIVE',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum SaleStatus {
  COMPLETED = 'COMPLETED',
  PARTIALLY_RETURNED = 'PARTIALLY_RETURNED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export enum SalePaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED',
}

export enum SalePaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_WALLET = 'MOBILE_WALLET',
  CREDIT = 'CREDIT',
  OTHER = 'OTHER',
}

export enum SalePaymentType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

export enum SaleReturnType {
  RETURN = 'RETURN',
  CANCELLATION = 'CANCELLATION',
}

export enum DiscountType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export enum MovementType {
  SUPPLIER_PURCHASE = 'SUPPLIER_PURCHASE',
  MARKETPLACE_PURCHASE = 'MARKETPLACE_PURCHASE',
  MARKETPLACE_SALE = 'MARKETPLACE_SALE',
  OFFER_PUBLISHED = 'OFFER_PUBLISHED',
  OFFER_CANCELLED = 'OFFER_CANCELLED',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  INVENTORY_COUNT = 'INVENTORY_COUNT',
  RETURNED = 'RETURNED',
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
  ADMIN_CORRECTION = 'ADMIN_CORRECTION',
  POS_SALE = 'POS_SALE',
  POS_RETURN = 'POS_RETURN',
  POS_CANCELLATION = 'POS_CANCELLATION',
}

export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_ACCEPTED = 'ORDER_ACCEPTED',
  ORDER_REJECTED = 'ORDER_REJECTED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  MARKETPLACE_PURCHASE = 'MARKETPLACE_PURCHASE',
  MARKETPLACE_SALE = 'MARKETPLACE_SALE',
  LOW_STOCK = 'LOW_STOCK',
  EXPIRY_ALERT = 'EXPIRY_ALERT',
  PRODUCT_REQUEST_SUBMITTED = 'PRODUCT_REQUEST_SUBMITTED',
  PRODUCT_APPROVED = 'PRODUCT_APPROVED',
  PRODUCT_REJECTED = 'PRODUCT_REJECTED',
  ORGANIZATION_APPROVED = 'ORGANIZATION_APPROVED',
  ORGANIZATION_REJECTED = 'ORGANIZATION_REJECTED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  SECURITY_LOGIN = 'SECURITY_LOGIN',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

export enum NotificationCategory {
  ORDERS = 'ORDERS',
  MARKETPLACE = 'MARKETPLACE',
  INVENTORY = 'INVENTORY',
  PHARMACY_EXCHANGE = 'PHARMACY_EXCHANGE',
  PRODUCT_REQUESTS = 'PRODUCT_REQUESTS',
  ADMIN_APPROVAL = 'ADMIN_APPROVAL',
  SYSTEM = 'SYSTEM',
  MARKETING = 'MARKETING',
}

export enum DigestFrequency {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export enum OfferStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  SOLD_OUT = 'SOLD_OUT',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum ListingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SOLD = 'SOLD',
  EXPIRED = 'EXPIRED',
}

export enum ImportStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum SyncModule {
  PRODUCTS = 'PRODUCTS',
  CATEGORIES = 'CATEGORIES',
  INVENTORY = 'INVENTORY',
  ORDERS = 'ORDERS',
  SETTINGS = 'SETTINGS',
}

// ─── Supported Locales ─────────────────────────────────────────────────────────

export type Locale = 'ar' | 'en' | 'tr';

export const SUPPORTED_LOCALES: Locale[] = ['ar', 'en'];
export const DEFAULT_LOCALE: Locale = 'ar';

// ─── API Response Types ────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Auth Types ────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;       // user ID
  email: string;
  role: UserRole;
  orgId?: string;    // pharmacy or supplier ID
  status?: UserStatus;
  orgStatus?: OrgStatus;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  emailVerifiedAt?: string;
  role: UserRole;
  status: UserStatus;
  orgId?: string;
  orgName?: string;
  orgStatus?: OrgStatus;
  accountState?: AccountVerificationState;
  organizationRejectionReason?: string;
  requiresOrganizationApproval?: boolean;
}

// ─── User Types ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// ─── Organization Types ────────────────────────────────────────────────────────

export interface Pharmacy {
  id: string;
  userId: string;
  name: string;
  licenseNumber: string;
  address: string;
  city: string;
  phone: string;
  logoUrl?: string;
  status: OrgStatus;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  userId: string;
  name: string;
  tradeRegister: string;
  address: string;
  city: string;
  phone: string;
  logoUrl?: string;
  status: OrgStatus;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Product Types ─────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  parentId?: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon?: string;
  isActive: boolean;
  children?: Category[];
}

export interface Manufacturer {
  id: string;
  name: string;
  country?: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  barcode?: string;
  tradeNameAr: string;
  tradeNameEn: string;
  scientificName?: string;
  dosageForm?: string;
  strength?: string;
  packageSize?: string;
  categoryId: string;
  category?: Category;
  manufacturerId?: string;
  manufacturer?: Manufacturer;
  imageUrl?: string;
  unit: string;
  description?: string;
  status: ProductStatus;
  version: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierProduct {
  id: string;
  supplierId: string;
  supplier?: Pick<Supplier, 'id' | 'name' | 'logoUrl'>;
  productId: string;
  product?: Product;
  price: number;
  stock: number;
  minOrder: number;
  expiryDate?: string;
  batchNumber?: string;
  quantityDiscounts?: Record<string, unknown>;
  isAvailable: boolean;
  updatedAt: string;
}

export interface ProductRequest {
  id: string;
  requesterId: string;
  brandName: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  dosageForm?: string;
  strength?: string;
  packageSize?: string;
  barcode?: string;
  imageUrl?: string;
  notes?: string;
  status: RequestStatus;
  rejectionReason?: string;
  resolvedProductId?: string;
  aiConfidenceScore?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Marketplace Types ─────────────────────────────────────────────────────────

export interface MarketplaceProduct extends Product {
  suppliers: SupplierProduct[];
  lowestPrice: number;
  highestPrice: number;
  totalSuppliers: number;
}

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  manufacturerId?: string;
  supplierId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  expiryAfter?: string;
}

// ─── Cart Types ─────────────────────────────────────────────────────────────────

export interface CartItem {
  supplierProductId: string;
  productId: string;
  supplierId: string;
  supplierName: string;
  productNameAr: string;
  productNameEn: string;
  productImage?: string;
  price: number;
  quantity: number;
  minOrder: number;
  maxStock: number;
  unit: string;
}

export interface CartGroup {
  supplierId: string;
  supplierName: string;
  items: CartItem[];
  subtotal: number;
}

// ─── Order Types ───────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  orderNumber: string;       // PSY-2026-000001
  checkoutGroupId: string;   // CHK-2026-000001
  pharmacyId: string;
  pharmacy?: Pick<Pharmacy, 'id' | 'name'>;
  supplierId?: string;
  supplier?: Pick<Supplier, 'id' | 'name'>;
  sellerPharmacyId?: string;
  sellerPharmacy?: Pick<Pharmacy, 'id' | 'name'>;
  status: OrderStatus;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentDueDate?: string;
  paymentNotes?: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  supplierProductId?: string;
  marketplaceOfferId?: string;
  product?: Pick<Product, 'id' | 'tradeNameAr' | 'tradeNameEn' | 'imageUrl' | 'unit'>;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// ─── Pharmacy POS Types ───────────────────────────────────────────────────────

export interface Sale {
  id: string;
  saleNumber: string;
  pharmacyId: string;
  staffUserId: string;
  status: SaleStatus;
  paymentStatus: SalePaymentStatus;
  subtotal: number;
  discountType?: DiscountType;
  discountValue?: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  tenderedAmount: number;
  changeAmount: number;
  refundedAmount: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  clientMutationId: string;
  deviceId: string;
  clientCreatedAt?: string;
  serverVersion: number;
  items?: SaleItem[];
  payments?: SalePayment[];
  returns?: SaleReturn[];
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productNameAr: string;
  productNameEn: string;
  barcodeSnapshot?: string;
  quantity: number;
  returnedQuantity: number;
  unitPrice: number;
  grossAmount: number;
  lineDiscountAmount: number;
  saleDiscountAmount: number;
  netAmount: number;
  returnedAmount: number;
  costAmount: number;
}

export interface SalePayment {
  id: string;
  saleId: string;
  saleReturnId?: string;
  type: SalePaymentType;
  method: SalePaymentMethod;
  amount: number;
  tenderedAmount: number;
  changeAmount: number;
  reference?: string;
  receivedByUserId: string;
  createdAt: string;
}

export interface SaleReturn {
  id: string;
  returnNumber: string;
  saleId: string;
  pharmacyId: string;
  staffUserId: string;
  type: SaleReturnType;
  reason: string;
  returnAmount: number;
  refundAmount: number;
  clientMutationId: string;
  deviceId: string;
  clientCreatedAt?: string;
  serverVersion: number;
  createdAt: string;
}

// ─── Inventory Types ───────────────────────────────────────────────────────────

export interface Inventory {
  id: string;
  pharmacyId: string;
  productId: string;
  product?: Product;
  batchNumber: string;
  expiryDate: string;
  purchaseCost: number;
  supplierId?: string;
  supplierName?: string;
  quantity: number;
  reservedStock: number;
  minStock: number;
  location?: string;
  notes?: string;
  deletedAt?: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  inventoryId: string;
  productId: string;
  pharmacyId: string;
  batchNumber: string;
  type: MovementType;
  quantity: number;
  prevQuantity: number;
  newQuantity: number;
  difference: number;
  reason?: string;
  referenceId?: string;
  orderId?: string;
  marketplaceOfferId?: string;
  userId: string;
  notes?: string;
  createdAt: string;
}

// ─── Notification Types ────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  channels: NotificationChannel[];
  isRead: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
}

// ─── Sync Types ────────────────────────────────────────────────────────────────

export interface SyncStatus {
  module: SyncModule;
  lastSync?: string;
  nextSync?: string;
  isSyncing: boolean;
}

export interface PendingChange {
  id?: number;
  type: 'CREATE_ORDER' | 'UPDATE_INVENTORY' | 'MARK_READ_NOTIFICATION';
  payload: Record<string, unknown>;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
}

// ─── Exchange Types ────────────────────────────────────────────────────────────

export interface ExchangeListing {
  id: string;
  pharmacyId: string;
  pharmacy?: Pick<Pharmacy, 'id' | 'name' | 'city'>;
  productId: string;
  product?: Product;
  quantity: number;
  expiryDate: string;
  price: number;
  city: string;
  status: ListingStatus;
  approvedAt?: string;
  createdAt: string;
}

export interface MarketplaceOffer {
  id: string;
  pharmacyId: string;
  productId: string;
  originalInventoryId: string;
  price: number;
  publishedQuantity: number;
  soldQuantity: number;
  expiryDate: string;
  batchNumber?: string;
  notes?: string;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Audit Types ───────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  prevValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  userId: string;
  orgId?: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  createdAt: string;
}

// ─── Socket Event Types ────────────────────────────────────────────────────────

export interface SocketEvents {
  // Emitted by server
  'notification:new': Notification;
  'order:status_changed': { orderId: string; status: OrderStatus; orderNumber: string };
  'inventory:updated': { productId: string; quantity: number };
  'sync:trigger': { module: SyncModule };

  // Emitted by client
  'room:join': { roomId: string };
  'room:leave': { roomId: string };
}
