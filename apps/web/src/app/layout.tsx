import type { Metadata } from "next";
import { Inter, Cairo, Lora } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/features/auth/auth-provider";
import { RealtimeNotifications } from "@/features/notifications/components/realtime-notifications";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

import { CustomCursor } from "@/components/ui/custom-cursor";
import { PageTransition } from "@/components/ui/motion/page-transition";
import { GlobalLoader } from "@/components/layout/global-loader";

export const metadata: Metadata = {
  title: "PharmaSY — The Pharmacy Operating System",
  description:
    "PharmaSY connects pharmacies, suppliers, and administrators on one platform for ordering, inventory, and analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <body className={`${inter.variable} ${cairo.variable} ${lora.variable} antialiased`}>
        <QueryProvider>
          <AuthProvider>
          <LocaleProvider>
            <RealtimeNotifications />
            <GlobalLoader />
            <CustomCursor />
            <PageTransition>
              {children}
            </PageTransition>
            <Toaster position="top-center" richColors />
          </LocaleProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
