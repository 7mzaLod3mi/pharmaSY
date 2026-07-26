import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@pharmasy.com";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <section className="py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 lg:grid-cols-2">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-600">
              Contact
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Talk to our team
            </h1>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
              Tell us about your pharmacy network or supply business and
              we&apos;ll help you get set up.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-brand-50 text-brand-600">
                <Mail className="size-4" />
              </div>
              <a
                className="text-[13.5px] text-foreground/80 hover:text-brand-600 hover:underline"
                href={`mailto:${supportEmail}`}
              >
                {supportEmail}
              </a>
            </div>
          </div>

          <Card className="p-6">
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">Contact PharmaSY support</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Send your organization details and a short description of what
                you need. Your email application will open with the verified
                support address.
              </p>
              <Button asChild size="lg" className="w-full">
                <a href={`mailto:${supportEmail}`}>Email support</a>
              </Button>
            </div>
          </Card>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
