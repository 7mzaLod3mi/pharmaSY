"use client";

import { FormEvent, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminNav } from "@/lib/nav-config";
import { normalizeApiError } from "@/lib/http-client";
import { useLocale } from "@/lib/i18n";
import {
  useAdminManufacturers,
  useCreateManufacturer,
  useDeleteManufacturer,
  useUpdateManufacturer,
} from "@/features/admin-catalog/hooks/use-admin-catalog";

const labels = {
  en: {
    title: "Manufacturers",
    description: "Manage verified manufacturers referenced by the global master catalog.",
    add: "Add manufacturer",
    name: "Manufacturer name",
    country: "Country",
    search: "Search manufacturers",
    empty: "No manufacturers found.",
    active: "Active",
    inactive: "Inactive",
    disable: "Deactivate",
    enable: "Activate",
    remove: "Delete",
    saved: "Manufacturer saved.",
  },
  ar: {
    title: "الشركات المصنّعة",
    description: "إدارة الشركات الموثوقة المرتبطة بالكتالوج المركزي.",
    add: "إضافة شركة",
    name: "اسم الشركة",
    country: "الدولة",
    search: "البحث عن شركة",
    empty: "لا توجد شركات مصنّعة.",
    active: "فعّالة",
    inactive: "متوقفة",
    disable: "إيقاف",
    enable: "تفعيل",
    remove: "حذف",
    saved: "تم حفظ الشركة.",
  },
} as const;

export default function AdminManufacturersPage() {
  const { locale } = useLocale();
  const text = labels[locale];
  const [search, setSearch] = useState("");
  const manufacturers = useAdminManufacturers(search);
  const create = useCreateManufacturer();
  const update = useUpdateManufacturer();
  const remove = useDeleteManufacturer();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await create.mutateAsync({ name, country: country || undefined });
      setName("");
      setCountry("");
      toast.success(text.saved);
    } catch (error) {
      toast.error(normalizeApiError(error).message);
    }
  };

  return (
    <DashboardShell sections={adminNav} roleLabel="Administrator" userName="Admin">
      <PageHeader title={text.title} description={text.description} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{text.add}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={submit}>
              <Input
                minLength={2}
                placeholder={text.name}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Input
                placeholder={text.country}
                value={country}
                onChange={(event) => setCountry(event.target.value)}
              />
              <Button className="w-full" disabled={create.isPending} type="submit">
                <Plus className="size-4" />
                {text.add}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="ps-9"
                placeholder={text.search}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            {manufacturers.isLoading ? <Skeleton className="h-20" /> : null}
            {!manufacturers.isLoading && manufacturers.data?.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{text.empty}</p>
            ) : null}
            {manufacturers.data?.map((manufacturer) => (
              <div
                className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                key={manufacturer.id}
              >
                <div>
                  <p className="font-medium">{manufacturer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {manufacturer.country || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={manufacturer.isActive ? "success" : "neutral"}>
                    {manufacturer.isActive ? text.active : text.inactive}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      update
                        .mutateAsync({
                          id: manufacturer.id,
                          data: { isActive: !manufacturer.isActive },
                        })
                        .catch((error) =>
                          toast.error(normalizeApiError(error).message)
                        )
                    }
                  >
                    {manufacturer.isActive ? text.disable : text.enable}
                  </Button>
                  <Button
                    aria-label={text.remove}
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (!window.confirm(text.remove + "?")) return;
                      remove
                        .mutateAsync(manufacturer.id)
                        .catch((error) =>
                          toast.error(normalizeApiError(error).message)
                        );
                    }}
                  >
                    <Trash2 className="size-4 text-danger-600" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
