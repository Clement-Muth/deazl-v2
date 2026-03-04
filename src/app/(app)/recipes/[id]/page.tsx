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

const GRADIENTS = [
  { from: "#FEF3C7", to: "#FDE68A", text: "#92400E" },
  { from: "#DCFCE7", to: "#BBF7D0", text: "#166534" },
  { from: "#EDE9FE", to: "#DDD6FE", text: "#5B21B6" },
  { from: "#E0F2FE", to: "#BAE6FD", text: "#075985" },
  { from: "#FFE4E6", to: "#FECDD3", text: "#9F1239" },
];

function gradientForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
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

  const grad = gradientForName(recipe.name);
  const initial = recipe.name.trim().charAt(0).toUpperCase();
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  return (
    <div className="relative min-h-screen bg-background">
      <div
        className="relative flex h-52 items-end"
        style={{ background: `linear-gradient(160deg, ${grad.from} 0%, ${grad.to} 100%)` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="select-none text-[96px] font-black leading-none tracking-tight opacity-20"
            style={{ color: grad.text }}
          >
            {initial}
          </span>
        </div>

        <div className="absolute left-4 right-4 top-12 flex items-center justify-between">
          <Link
            href="/recipes"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/10 text-gray-700 backdrop-blur-sm transition active:scale-[0.94]"
            aria-label="Retour"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/10 text-gray-700 backdrop-blur-sm transition active:scale-[0.94]"
            aria-label="Modifier"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
        </div>

        <div className="relative w-full px-5 pb-5">
          <h1 className="text-xl font-black tracking-tight" style={{ color: grad.text }}>
            {recipe.name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: grad.text, opacity: 0.7 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {recipe.servings} pers.
            </span>
            {totalTime > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium" style={{ color: grad.text, opacity: 0.7 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {fmtTime(totalTime)}
              </span>
            )}
            {recipe.ingredients.length > 0 && (
              <span className="text-xs font-medium" style={{ color: grad.text, opacity: 0.7 }}>
                {recipe.ingredients.length} ingrédients
              </span>
            )}
          </div>
        </div>
      </div>

      {recipe.description && (
        <div className="px-5 pt-4">
          <p className="text-sm leading-relaxed text-gray-600">{recipe.description}</p>
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

      <div className="flex justify-center pb-8">
        <RecipeDeleteButton id={recipe.id} />
      </div>
    </div>
  );
}
