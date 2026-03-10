import { notFound } from "next/navigation";
import { getPublicRecipe } from "@/applications/recipe/application/useCases/getPublicRecipe";

interface Props {
  params: Promise<{ id: string }>;
}

const DIETARY_LABELS: Record<string, string> = {
  vegetarian: "Végétarien",
  vegan: "Vegan",
  gluten_free: "Sans gluten",
  lactose_free: "Sans lactose",
  halal: "Halal",
  kosher: "Casher",
  no_pork: "Sans porc",
  no_seafood: "Sans fruits de mer",
};

const PALETTES = [
  { from: "#FFF7ED", to: "#FED7AA", text: "#7C2D12", accent: "#EA580C" },
  { from: "#F0FDF4", to: "#BBF7D0", text: "#14532D", accent: "#16A34A" },
  { from: "#EDE9FE", to: "#C4B5FD", text: "#4C1D95", accent: "#7C3AED" },
  { from: "#E0F2FE", to: "#7DD3FC", text: "#0C4A6E", accent: "#0284C7" },
  { from: "#FFF1F2", to: "#FECDD3", text: "#881337", accent: "#E11D48" },
  { from: "#F0FDFA", to: "#99F6E4", text: "#134E4A", accent: "#0D9488" },
];

function paletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

function fmtTime(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

export default async function PublicRecipePage({ params }: Props) {
  const { id } = await params;
  const recipe = await getPublicRecipe(id);
  if (!recipe) notFound();

  const pal = paletteFor(recipe.name);
  const hasImg = !!recipe.imageUrl;
  const heroText = hasImg ? "#ffffff" : pal.text;
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  return (
    <div className="min-h-screen bg-background">
      <div
        className="relative flex min-h-64 flex-col justify-end"
        style={hasImg ? undefined : { background: `linear-gradient(150deg, ${pal.from} 0%, ${pal.to} 100%)` }}
      >
        {hasImg ? (
          <>
            <img src={recipe.imageUrl!} alt={recipe.name} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-[120px] font-black leading-none"
            style={{ color: pal.accent, opacity: 0.12 }}
          >
            {recipe.name.charAt(0).toUpperCase()}
          </span>
        )}

        <div className="absolute left-5 top-12 flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: hasImg ? "rgba(255,255,255,0.18)" : `${pal.accent}18`, backdropFilter: "blur(8px)" }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={heroText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 4-3 6-3 9H8c0-3-3-5-3-9a7 7 0 0 1 7-7z" />
              <path d="M8 18h8" /><path d="M9 21h6" />
            </svg>
            <span className="text-[11px] font-bold" style={{ color: heroText }}>Deazl</span>
          </div>
        </div>

        <div className="relative px-5 pb-7 pt-12">
          <h1 className="text-2xl font-black leading-tight tracking-tight" style={{ color: heroText }}>
            {recipe.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: hasImg ? "rgba(255,255,255,0.18)" : `${pal.accent}18`, color: heroText }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
              {recipe.servings} pers.
            </span>
            {totalTime > 0 && (
              <span
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: hasImg ? "rgba(255,255,255,0.18)" : `${pal.accent}18`, color: heroText }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {fmtTime(totalTime)}
              </span>
            )}
            {recipe.dietaryTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: hasImg ? "rgba(255,255,255,0.18)" : `${pal.accent}18`, color: heroText }}
              >
                {DIETARY_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative -mt-5 rounded-t-[28px] bg-background shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        {recipe.description && (
          <div className="border-b border-border/60 px-5 pb-4 pt-5">
            <p className="text-sm leading-relaxed text-muted-foreground">{recipe.description}</p>
          </div>
        )}

        {recipe.ingredients.length > 0 && (
          <div className="border-b border-border/60 px-5 py-5">
            <h2 className="mb-3 text-sm font-black text-foreground">
              Ingrédients · {recipe.servings} pers.
            </h2>
            <div className="flex flex-col gap-2.5">
              {recipe.ingredients.map((ing) => (
                <div key={ing.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-foreground">{ing.customName}</span>
                  <span className="shrink-0 text-sm font-semibold text-muted-foreground">
                    {ing.quantity > 0 ? `${ing.quantity} ${ing.unit}` : ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {recipe.steps.length > 0 && (
          <div className="px-5 py-5">
            <h2 className="mb-3 text-sm font-black text-foreground">Préparation</h2>
            <div className="flex flex-col gap-5">
              {recipe.steps.map((step) => (
                <div key={step.id} className="flex gap-3">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                    style={{ background: pal.accent }}
                  >
                    {step.stepNumber}
                  </div>
                  <p className="pt-0.5 text-sm leading-relaxed text-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border/40 px-5 py-6 text-center">
          <p className="text-xs text-muted-foreground">Partagé via</p>
          <a href="/" className="mt-1 text-sm font-black text-primary">Deazl</a>
          <p className="mt-1 text-xs text-muted-foreground">Planification de repas intelligente</p>
        </div>
      </div>
    </div>
  );
}
