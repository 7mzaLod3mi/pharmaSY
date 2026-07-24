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
  Bell,
  Settings,
  Users,
  FileBarChart,
  Building2,
  ShieldCheck,
  ClipboardList,
  UploadCloud,
  Receipt,
} from "lucide-react";
import type { NavSection } from "@/components/layout/sidebar";

export const pharmacyNav: NavSection[] = [
  {
    items: [
      { label: "workspace.dashboard", href: "/pharmacy/dashboard", icon: LayoutGrid },
      { label: "workspace.pos", href: "/pharmacy/pos", icon: Receipt },
    ],
  },
  {
    title: "workspace.buy",
    items: [
      { label: "workspace.marketplace", href: "/pharmacy/marketplace", icon: Store },
      { label: "workspace.cart", href: "/pharmacy/cart", icon: ShoppingCart },
    ],
  },
  {
    title: "workspace.operations",
    items: [
      { label: "workspace.orders", href: "/pharmacy/orders", icon: ClipboardList },
      { label: "workspace.inventory", href: "/pharmacy/inventory", icon: Boxes },
      { label: "workspace.movements", href: "/pharmacy/inventory/movements", icon: ArrowLeftRight },
      { label: "workspace.lowStock", href: "/pharmacy/inventory/alerts/low-stock", icon: AlertTriangle },
      { label: "workspace.expiry", href: "/pharmacy/inventory/alerts/expiry", icon: AlertTriangle },
      { label: "workspace.setupImport", href: "/pharmacy/setup", icon: UploadCloud },
      { label: "workspace.reports", href: "/pharmacy/reports", icon: FileBarChart },
    ],
  },
  {
    title: "workspace.account",
    items: [
      { label: "workspace.notifications", href: "/notifications", icon: Bell },
      { label: "workspace.settings", href: "/profile", icon: Settings },
    ],
  },
];

export const supplierNav: NavSection[] = [
  { items: [{ label: "workspace.dashboard", href: "/supplier/dashboard", icon: LayoutGrid }] },
  {
    title: "workspace.catalog",
    items: [
      { label: "workspace.products", href: "/supplier/products", icon: Package },
      { label: "workspace.importExcel", href: "/supplier/products/import", icon: UploadCloud },
    ],
  },
  {
    title: "workspace.business",
    items: [
      { label: "workspace.orders", href: "/supplier/orders", icon: ClipboardList },
      { label: "workspace.reports", href: "/supplier/reports", icon: FileBarChart },
    ],
  },
  {
    title: "workspace.account",
    items: [
      { label: "workspace.notifications", href: "/notifications", icon: Bell },
      { label: "workspace.settings", href: "/profile", icon: Settings },
    ],
  },
];

export const adminNav: NavSection[] = [
  { items: [{ label: "workspace.dashboard", href: "/admin/dashboard", icon: LayoutGrid }] },
  {
    title: "workspace.network",
    items: [
      { label: "workspace.organizations", href: "/admin/organizations", icon: Building2 },
      { label: "workspace.users", href: "/admin/users", icon: Users },
      { label: "workspace.approvals", href: "/admin/approvals", icon: ShieldCheck },
    ],
  },
  {
    title: "workspace.catalog",
    items: [
      { label: "workspace.categories", href: "/admin/categories", icon: Tags },
      { label: "workspace.manufacturers", href: "/admin/manufacturers", icon: Factory },
      { label: "workspace.products", href: "/admin/products", icon: Package },
    ],
  },
  {
    title: "workspace.governance",
    items: [
      { label: "workspace.audit", href: "/admin/audit-logs", icon: ClipboardList },
      { label: "workspace.notifications", href: "/notifications", icon: Bell },
      { label: "workspace.settings", href: "/profile", icon: Settings },
    ],
  },
];
