import Link from "next/link";
import { notFound } from "next/navigation";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { getRecipe } from "@/applications/recipe/application/useCases/getRecipe";
import { getRecipePricesByStore } from "@/applications/recipe/application/useCases/getRecipePricesByStore";
import { RecipeDeleteButton } from "@/applications/recipe/ui/components/recipeDeleteButton";
import { RecipeDetailView } from "@/applications/recipe/ui/components/recipeDetailView";

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

const PALETTES = [
  { from: "#FFF7ED", to: "#FED7AA", text: "#7C2D12", accent: "#EA580C" },
  { from: "#F0FDF4", to: "#BBF7D0", text: "#14532D", accent: "#16A34A" },
  { from: "#EDE9FE", to: "#C4B5FD", text: "#4C1D95", accent: "#7C3AED" },
  { from: "#E0F2FE", to: "#7DD3FC", text: "#0C4A6E", accent: "#0284C7" },
  { from: "#FFF1F2", to: "#FECDD3", text: "#881337", accent: "#E11D48" },
  { from: "#F0FDFA", to: "#99F6E4", text: "#134E4A", accent: "#0D9488" },
];

function paletteForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

function fmtTime(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

export default async function RecipePage({ params }: RecipePageProps) {
  await initLinguiFromCookie();
  const { id } = await params;
  const [recipe, storePrices] = await Promise.all([
    getRecipe(id),
    getRecipePricesByStore(id),
  ]);

  if (!recipe) notFound();

  const pal = paletteForName(recipe.name);
  const initial = recipe.name.trim().charAt(0).toUpperCase();
  const hasImage = !!recipe.imageUrl;
  const heroText = hasImage ? "#ffffff" : pal.text;
  const heroPillBg = hasImage ? "rgba(255,255,255,0.18)" : `${pal.accent}18`;
  const heroBtnBg = hasImage ? "rgba(0,0,0,0.25)" : `${pal.accent}20`;
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const totalPrice = recipe.ingredients.reduce(
    (sum, ing) => (ing.latestPrice ? sum + ing.latestPrice.price : sum),
    0,
  );

  return (
    <div className="relative min-h-screen bg-background">
      <div
        className="relative flex min-h-70 flex-col justify-end"
        style={recipe.imageUrl ? undefined : { background: `linear-gradient(150deg, ${pal.from} 0%, ${pal.to} 100%)` }}
      >
        {recipe.imageUrl ? (
          <>
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-[130px] font-black leading-none tracking-tight"
            style={{ color: pal.accent, opacity: 0.13 }}
          >
            {initial}
          </span>
        )}

        <div className="absolute left-4 right-4 top-12 flex items-center justify-between">
          <Link
            href="/recipes"
            className="flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-sm transition active:scale-[0.94]"
            style={{ background: heroBtnBg, color: heroText }}
            aria-label="Retour"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-sm transition active:scale-[0.94]"
            style={{ background: heroBtnBg, color: heroText }}
            aria-label="Modifier"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
        </div>

        <div className="relative px-5 pb-7 pt-16">
          <h1
            className="text-2xl font-black leading-tight tracking-tight"
            style={{ color: heroText }}
          >
            {recipe.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: heroPillBg, color: heroText }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {recipe.servings} pers.
            </span>
            {totalTime > 0 && (
              <span
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: heroPillBg, color: heroText }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {fmtTime(totalTime)}
              </span>
            )}
            {recipe.ingredients.length > 0 && (
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: heroPillBg, color: heroText }}
              >
                {recipe.ingredients.length} ingr.
              </span>
            )}
            {totalPrice > 0 && (
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                style={{ background: hasImage ? "rgba(0,0,0,0.35)" : pal.accent }}
              >
                ~{totalPrice.toFixed(0)} €
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative -mt-5 rounded-t-[28px] bg-background shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        {recipe.description && (
          <div className="border-b border-black/5 px-5 pb-4 pt-5">
            <p className="text-sm leading-relaxed text-muted-foreground">{recipe.description}</p>
          </div>
        )}

        <RecipeDetailView
          recipeId={recipe.id}
          recipeName={recipe.name}
          baseServings={recipe.servings}
          ingredients={recipe.ingredients}
          steps={recipe.steps}
          storePrices={storePrices}
        />

        <div className="flex justify-center pb-10 pt-2">
          <RecipeDeleteButton id={recipe.id} />
        </div>
      </div>
    </div>
  );
}
