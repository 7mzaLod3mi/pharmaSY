import { PillLoader } from "@/components/shared/pill-loader";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <PillLoader />
    </div>
  );
}
