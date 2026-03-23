import type { ReactNode } from "react";
import { StoreHeader } from "@/components/StoreHeader";
import { StoreFooter } from "@/components/StoreFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getSettings } from "@/lib/settings";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="site">
      <StoreHeader shopName={settings.shopName} />
      <main>{children}</main>
      <StoreFooter shopName={settings.shopName} />
      <WhatsAppButton phone={settings.whatsappNumber} />
    </div>
  );
}

export const dynamic = "force-dynamic";

