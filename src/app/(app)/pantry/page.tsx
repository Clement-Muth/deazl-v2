import { initLinguiFromCookie } from "@/lib/i18n/server";
import { getPantryItems } from "@/applications/pantry/application/useCases/getPantryItems";
import { PantryView } from "@/applications/pantry/ui/components/pantryView";

export default async function PantryPage() {
  await initLinguiFromCookie();
  const items = await getPantryItems();

  const expiredCount = items.filter((i) => {
    if (!i.expiryDate) return false;
    return new Date(i.expiryDate).getTime() < Date.now();
  }).length;

  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/70 px-5 pb-3 pt-5 backdrop-blur-xl">
        <h1 className="text-xl font-black tracking-tight text-foreground">Mes stocks</h1>
        <p className="mt-0.5 text-xs font-medium text-gray-400">
          {items.length === 0
            ? "Aucun produit"
            : `${items.length} produit${items.length > 1 ? "s" : ""}${expiredCount > 0 ? ` · ${expiredCount} expiré${expiredCount > 1 ? "s" : ""}` : ""}`}
        </p>
      </header>

      <PantryView items={items} />
    </div>
  );
}
