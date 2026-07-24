"use client";

import { FormEvent, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/features/admin-catalog/hooks/use-admin-catalog";

const labels = {
  en: {
    title: "Categories",
    description: "Manage the bilingual hierarchy used by the global master catalog.",
    add: "Add category",
    nameEn: "English name",
    nameAr: "Arabic name",
    slug: "Slug",
    empty: "No categories found.",
    active: "Active",
    inactive: "Inactive",
    disable: "Deactivate",
    enable: "Activate",
    remove: "Delete",
    saved: "Category saved.",
  },
  ar: {
    title: "التصنيفات",
    description: "إدارة شجرة التصنيفات العربية والإنجليزية للكتالوج المركزي.",
    add: "إضافة تصنيف",
    nameEn: "الاسم بالإنجليزية",
    nameAr: "الاسم بالعربية",
    slug: "الرابط المختصر",
    empty: "لا توجد تصنيفات.",
    active: "فعّال",
    inactive: "متوقف",
    disable: "إيقاف",
    enable: "تفعيل",
    remove: "حذف",
    saved: "تم حفظ التصنيف.",
  },
} as const;

export default function AdminCategoriesPage() {
  const { locale } = useLocale();
  const text = labels[locale];
  const categories = useAdminCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [slug, setSlug] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await create.mutateAsync({ nameEn, nameAr, slug, sortOrder: 0 });
      setNameEn("");
      setNameAr("");
      setSlug("");
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
                placeholder={text.nameEn}
                required
                value={nameEn}
                onChange={(event) => {
                  setNameEn(event.target.value);
                  if (!slug) {
                    setSlug(
                      event.target.value
                        .trim()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "")
                    );
                  }
                }}
              />
              <Input
                dir="rtl"
                minLength={2}
                placeholder={text.nameAr}
                required
                value={nameAr}
                onChange={(event) => setNameAr(event.target.value)}
              />
              <Input
                minLength={2}
                placeholder={text.slug}
                required
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
              />
              <Button className="w-full" disabled={create.isPending} type="submit">
                <Plus className="size-4" />
                {text.add}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4">
            {categories.isLoading ? <Skeleton className="h-20" /> : null}
            {!categories.isLoading && categories.data?.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{text.empty}</p>
            ) : null}
            {categories.data?.map((category) => (
              <div
                className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                key={category.id}
              >
                <div>
                  <p className="font-medium">{category.nameEn}</p>
                  <p className="text-sm text-muted-foreground">{category.nameAr}</p>
                  <p className="text-xs text-muted-foreground">/{category.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={category.isActive ? "success" : "neutral"}>
                    {category.isActive ? text.active : text.inactive}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      update
                        .mutateAsync({
                          id: category.id,
                          data: { isActive: !category.isActive },
                        })
                        .catch((error) =>
                          toast.error(normalizeApiError(error).message)
                        )
                    }
                  >
                    {category.isActive ? text.disable : text.enable}
                  </Button>
                  <Button
                    aria-label={text.remove}
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (!window.confirm(text.remove + "?")) return;
                      remove
                        .mutateAsync(category.id)
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
