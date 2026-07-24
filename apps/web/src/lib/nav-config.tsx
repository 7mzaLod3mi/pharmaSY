import {
  LayoutGrid,
  Store,
  Package,
  Tags,
  Factory,
  ShoppingCart,
  Boxes,
  ArrowLeftRight,
  AlertTriangle,
  Heart,
  Bell,
  Settings,
  Users,
  FileBarChart,
  Building2,
  ShieldCheck,
  ClipboardList,
  UploadCloud,
  Recycle,
} from "lucide-react";
import type { NavSection } from "@/components/layout/sidebar";

export const pharmacyNav: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: "/pharmacy/dashboard", icon: LayoutGrid }],
  },
  {
    title: "Buy",
    items: [
      { label: "Marketplace", href: "/pharmacy/marketplace", icon: Store },
      { label: "Products", href: "/pharmacy/products", icon: Package },
      { label: "Categories", href: "/pharmacy/categories", icon: Tags },
      { label: "Manufacturers", href: "/pharmacy/manufacturers", icon: Factory },
      { label: "Cart", href: "/pharmacy/cart", icon: ShoppingCart },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Orders", href: "/pharmacy/orders", icon: ClipboardList },
      { label: "Inventory", href: "/pharmacy/inventory", icon: Boxes },
      { label: "Movements", href: "/pharmacy/inventory/movements", icon: ArrowLeftRight },
      { label: "Expiry alerts", href: "/pharmacy/inventory/expiry", icon: AlertTriangle, badge: "5" },
      { label: "Exchange", href: "/pharmacy/exchange", icon: Recycle },
      { label: "Favorites", href: "/pharmacy/favorites", icon: Heart },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Notifications", href: "/pharmacy/notifications", icon: Bell },
      { label: "Settings", href: "/pharmacy/settings", icon: Settings },
    ],
  },
];

export const supplierNav: NavSection[] = [
  { items: [{ label: "Dashboard", href: "/supplier/dashboard", icon: LayoutGrid }] },
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/supplier/products", icon: Package },
      { label: "Import Excel", href: "/supplier/products/import", icon: UploadCloud },
      { label: "Inventory", href: "/supplier/inventory", icon: Boxes },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Orders", href: "/supplier/orders", icon: ClipboardList },
      { label: "Customers", href: "/supplier/customers", icon: Users },
      { label: "Reports", href: "/supplier/reports", icon: FileBarChart },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Notifications", href: "/supplier/notifications", icon: Bell },
      { label: "Settings", href: "/supplier/settings", icon: Settings },
    ],
  },
];

export const adminNav: NavSection[] = [
  { items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutGrid }] },
  {
    title: "Network",
    items: [
      { label: "Organizations", href: "/admin/organizations", icon: Building2 },
      { label: "Pharmacies", href: "/admin/pharmacies", icon: Store },
      { label: "Suppliers", href: "/admin/suppliers", icon: Factory },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Approvals", href: "/admin/approvals", icon: ShieldCheck, badge: "8" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Categories", href: "/admin/categories", icon: Tags },
      { label: "Manufacturers", href: "/admin/manufacturers", icon: Factory },
      { label: "Products", href: "/admin/products", icon: Package },
    ],
  },
  {
    title: "Governance",
    items: [
      { label: "Audit logs", href: "/admin/audit-logs", icon: ClipboardList },
      { label: "Reports", href: "/admin/reports", icon: FileBarChart },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];
