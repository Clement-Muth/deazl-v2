import { initLinguiFromCookie } from "@/lib/i18n/server";
import { ScanView } from "@/applications/catalog/ui/components/scanView";

export default async function ScanPage() {
  await initLinguiFromCookie();
  return <ScanView />;
}
