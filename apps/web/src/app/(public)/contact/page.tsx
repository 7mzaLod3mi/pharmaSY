import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, MapPin, Phone } from "lucide-react";

const info = [
  { icon: Mail, label: "hello@pharmasy.com" },
  { icon: Phone, label: "+962 6 000 0000" },
  { icon: MapPin, label: "Amman, Jordan" },
];

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
            <div className="mt-8 space-y-4">
              {info.map((i) => (
                <div key={i.label} className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-brand-50 text-brand-600">
                    <i.icon className="size-4" />
                  </div>
                  <span className="text-[13.5px] text-foreground/80">{i.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="p-6">
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" placeholder="Your name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" placeholder="Organization" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" placeholder="you@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Tell us about your needs…"
                  className="flex w-full rounded-[var(--radius-sm)] border border-border-strong bg-surface px-3 py-2 text-sm shadow-[var(--shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:border-brand-500"
                />
              </div>
              <Button type="submit" size="lg" className="w-full">
                Send message
              </Button>
            </form>
          </Card>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
