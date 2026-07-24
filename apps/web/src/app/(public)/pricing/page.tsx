import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <Badge variant="brand">
          <Sparkles className="size-3" /> Coming soon
        </Badge>
        <h1 className="mt-4 max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
          Pricing plans are on the way
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">
          We&apos;re finalizing plans for pharmacies, suppliers, and networks of
          any size. Reach out to our team for early access and onboarding.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Button size="lg" asChild>
            <Link href="/contact">Talk to sales</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">Create a workspace</Link>
          </Button>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
