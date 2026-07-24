import { NotificationType } from '@prisma/client';

export interface NotificationContent {
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}

export type TemplateData = Record<string, string | number | undefined>;

export class NotificationTemplate {
  private static templates: Record<
    NotificationType,
    (data: TemplateData) => NotificationContent
  > = {
    [NotificationType.ORDER_CREATED]: (data) => ({
      titleAr: 'طلب جديد',
      titleEn: 'New Order',
      bodyAr: `تم إنشاء طلب جديد رقم ${data.orderNumber} من صيدلية ${data.pharmacyName}.`,
      bodyEn: `A new order ${data.orderNumber} has been created by ${data.pharmacyName}.`,
    }),
    [NotificationType.ORDER_ACCEPTED]: (data) => ({
      titleAr: 'تم قبول الطلب',
      titleEn: 'Order Accepted',
      bodyAr: `تم قبول طلبك رقم ${data.orderNumber} من قبل المورد.`,
      bodyEn: `Your order ${data.orderNumber} has been accepted by the supplier.`,
    }),
    [NotificationType.ORDER_REJECTED]: (data) => ({
      titleAr: 'تم رفض الطلب',
      titleEn: 'Order Rejected',
      bodyAr: `عذراً، تم رفض طلبك رقم ${data.orderNumber}.`,
      bodyEn: `Sorry, your order ${data.orderNumber} has been rejected.`,
    }),
    [NotificationType.ORDER_DELIVERED]: (data) => ({
      titleAr: 'تم التوصيل',
      titleEn: 'Order Delivered',
      bodyAr: `تم توصيل طلبك رقم ${data.orderNumber} بنجاح.`,
      bodyEn: `Your order ${data.orderNumber} has been successfully delivered.`,
    }),
    [NotificationType.MARKETPLACE_PURCHASE]: (data) => ({
      titleAr: 'شراء من السوق',
      titleEn: 'Marketplace Purchase',
      bodyAr: `تم شراء ${data.quantity} من ${data.productName} عبر السوق.`,
      bodyEn: `Purchased ${data.quantity} of ${data.productName} via marketplace.`,
    }),
    [NotificationType.MARKETPLACE_SALE]: (data) => ({
      titleAr: 'مبيع في السوق',
      titleEn: 'Marketplace Sale',
      bodyAr: `تم بيع ${data.quantity} من ${data.productName} في السوق.`,
      bodyEn: `Sold ${data.quantity} of ${data.productName} on the marketplace.`,
    }),
    [NotificationType.LOW_STOCK]: (data) => ({
      titleAr: 'تنبيه: مخزون منخفض',
      titleEn: 'Low Stock Alert',
      bodyAr: `مخزون ${data.productName} وصل إلى ${data.quantity} (الحد الأدنى: ${data.minStock}).`,
      bodyEn: `Stock for ${data.productName} is at ${data.quantity} (min: ${data.minStock}).`,
    }),
    [NotificationType.EXPIRY_ALERT]: (data) => ({
      titleAr: 'تنبيه: صلاحية قريبة',
      titleEn: 'Expiry Alert',
      bodyAr: `الصنف ${data.productName} (تشغيلة ${data.batchNumber}) سينتهي في ${data.expiryDate}.`,
      bodyEn: `Product ${data.productName} (Batch ${data.batchNumber}) expires on ${data.expiryDate}.`,
    }),
    [NotificationType.PRODUCT_REQUEST_SUBMITTED]: (data) => ({
      titleAr: 'تم استلام طلب إضافة منتج',
      titleEn: 'Product Request Submitted',
      bodyAr: `تم استلام طلب إضافة المنتج ${data.productName} وهو قيد المراجعة.`,
      bodyEn: `Your request to add ${data.productName} has been received and is under review.`,
    }),
    [NotificationType.PRODUCT_APPROVED]: (data) => ({
      titleAr: 'تمت الموافقة على المنتج',
      titleEn: 'Product Approved',
      bodyAr: `تمت الموافقة على إضافة المنتج ${data.productName}.`,
      bodyEn: `Your request to add ${data.productName} has been approved.`,
    }),
    [NotificationType.PRODUCT_REJECTED]: (data) => ({
      titleAr: 'تم رفض المنتج',
      titleEn: 'Product Rejected',
      bodyAr: `نعتذر، تم رفض طلب إضافة المنتج ${data.productName}.`,
      bodyEn: `Sorry, your request to add ${data.productName} was rejected.`,
    }),
    [NotificationType.ORGANIZATION_APPROVED]: (data) => ({
      titleAr: 'تم تفعيل الحساب',
      titleEn: 'Account Activated',
      bodyAr: `مرحباً بك! تم تفعيل حساب ${data.orgName} بنجاح.`,
      bodyEn: `Welcome! Your account ${data.orgName} has been successfully activated.`,
    }),
    [NotificationType.ORGANIZATION_REJECTED]: (data) => ({
      titleAr: 'تم رفض الحساب',
      titleEn: 'Account Rejected',
      bodyAr: `عذراً، لم يتم قبول طلب تسجيل حساب ${data.orgName}.`,
      bodyEn: `Sorry, your account registration for ${data.orgName} was rejected.`,
    }),
    [NotificationType.SYSTEM_ANNOUNCEMENT]: (data) => ({
      titleAr: String(data.titleAr || 'إعلان نظام'),
      titleEn: String(data.titleEn || 'System Announcement'),
      bodyAr: String(data.bodyAr || ''),
      bodyEn: String(data.bodyEn || ''),
    }),
    [NotificationType.PASSWORD_RESET]: (data) => ({
      titleAr: 'إعادة تعيين كلمة المرور',
      titleEn: 'Password Reset',
      bodyAr: 'تم طلب إعادة تعيين كلمة المرور لحسابك.',
      bodyEn: 'A password reset was requested for your account.',
    }),
    [NotificationType.SECURITY_LOGIN]: (data) => ({
      titleAr: 'تنبيه أمني: تسجيل دخول جديد',
      titleEn: 'Security Alert: New Login',
      bodyAr: `تم تسجيل دخول لحسابك من جهاز جديد (${data.userAgent}).`,
      bodyEn: `A new login to your account was detected from (${data.userAgent}).`,
    }),
  };

  static generate(type: NotificationType, data: TemplateData): NotificationContent {
    const templateFn = this.templates[type];
    if (!templateFn) {
      return {
        titleAr: 'إشعار جديد',
        titleEn: 'New Notification',
        bodyAr: 'يوجد تحديث جديد في حسابك.',
        bodyEn: 'There is a new update in your account.',
      };
    }
    return templateFn(data);
  }
}
