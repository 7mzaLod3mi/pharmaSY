import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card } from "@/components/ui/card";
import { Target, Users, Globe2 } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Built for the pharmacy business",
    description:
      "Every workflow is modeled on real pharmacy procurement and inventory operations, not adapted from generic e-commerce.",
  },
  {
    icon: Users,
    title: "One platform, three roles",
    description:
      "Pharmacies, suppliers, and administrators work from the same source of truth, with permissions matched to each role.",
  },
  {
    icon: Globe2,
    title: "Regional by design",
    description:
      "Arabic and English are first-class from day one, including full right-to-left layout support.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-600">
            About PharmaSY
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Building the operating system for pharmacy commerce
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-muted-foreground">
            PharmaSY started from a simple observation: pharmacy procurement in
            the region still runs on phone calls, spreadsheets, and paper
            invoices. We&apos;re building the connected alternative.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {values.map((v) => (
              <Card key={v.title} className="p-6">
                <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-brand-50 text-brand-600">
                  <v.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold">{v.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {v.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
