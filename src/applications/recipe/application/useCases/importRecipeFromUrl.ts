"use server";

export interface ImportedIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface ImportedRecipe {
  name: string;
  description: string | null;
  servings: number;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  imageUrl: string | null;
  sourceUrl: string;
  ingredients: ImportedIngredient[];
  steps: string[];
}

export type ImportResult = { data: ImportedRecipe } | { error: string };

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
};

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const html = await res.text();
      if (!isBlockedPage(html)) return html;
    }
  } catch {
    // fallthrough
  }

  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const res = await fetch(jinaUrl, {
      headers: { Accept: "text/html", "X-Return-Format": "html" },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const html = await res.text();
      if (!isBlockedPage(html)) return html;
    }
  } catch {
    // fallthrough
  }

  return null;
}

function isBlockedPage(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    (lower.includes("cloudflare") && lower.includes("challenge")) ||
    lower.includes("enable javascript") ||
    lower.includes("access denied") ||
    html.length < 500
  );
}

export async function importRecipeFromUrl(url: string): Promise<ImportResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return { error: "URL invalide" };
  }

  const html = await fetchHtml(parsedUrl.href);
  if (!html) return { error: "Impossible de charger la page (site protégé ou inaccessible)" };

  const jsonLdBlocks = [...html.matchAll(/<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)];

  for (const block of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(block[1]);
      const recipe = findRecipe(parsed);
      if (recipe) return { data: { ...recipe, sourceUrl: url.trim() } };
    } catch {
      continue;
    }
  }

  return { error: "Aucune recette trouvée sur cette page. Essaie un site comme Marmiton, 750g ou AllRecipes." };
}

function findRecipe(data: unknown): Omit<ImportedRecipe, "sourceUrl"> | null {
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const r = findRecipe(item);
      if (r) return r;
    }
    return null;
  }

  const obj = data as Record<string, unknown>;

  if ("@graph" in obj && Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      const r = findRecipe(item);
      if (r) return r;
    }
  }

  const type = obj["@type"];
  const isRecipe =
    type === "Recipe" ||
    (Array.isArray(type) && type.includes("Recipe"));

  if (!isRecipe) return null;

  const name = typeof obj.name === "string" ? obj.name.trim() : null;
  if (!name) return null;

  return {
    name,
    description: typeof obj.description === "string" ? obj.description.replace(/<[^>]*>/g, "").trim() || null : null,
    servings: parseServings(obj.recipeYield),
    prepTimeMinutes: parseDuration(obj.prepTime),
    cookTimeMinutes: parseDuration(obj.cookTime),
    imageUrl: parseImage(obj.image),
    ingredients: parseIngredients(obj.recipeIngredient),
    steps: parseSteps(obj.recipeInstructions),
  };
}

function parseDuration(value: unknown): number | null {
  if (!value || typeof value !== "string") return null;
  const m = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return null;
  const h = parseInt(m[1] ?? "0", 10);
  const min = parseInt(m[2] ?? "0", 10);
  const total = h * 60 + min;
  return total > 0 ? total : null;
}

function parseServings(value: unknown): number {
  if (!value) return 4;
  const str = Array.isArray(value) ? String(value[0]) : String(value);
  const n = parseInt(str.replace(/[^\d]/g, ""), 10);
  return n > 0 ? n : 4;
}

function parseImage(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value || null;
  if (Array.isArray(value)) return parseImage(value[0]);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return typeof obj.url === "string" ? obj.url || null : null;
  }
  return null;
}

function parseIngredients(value: unknown): ImportedIngredient[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? parseIngredientString(v) : null))
    .filter((v): v is ImportedIngredient => v !== null);
}

function parseIngredientString(raw: string): ImportedIngredient {
  const text = raw.trim().replace(/\s+/g, " ");

  const UNITS = [
    "kg", "g", "mg", "l", "litre", "litres", "cl", "ml", "dl",
    "tasse", "tasses", "verre", "verres",
    "c\\.?\\s*à\\s*s(?:oupe)?", "c\\.?\\s*à\\s*c(?:afé)?",
    "càs", "càc",
    "tbsp", "tsp", "cup", "oz", "lb",
    "pincée", "pincées", "poignée", "poignées",
    "tranche", "tranches", "morceau", "morceaux",
    "botte", "bottes", "bouquet", "bouquets",
    "sachet", "sachets", "boîte", "boîtes",
    "pièce", "pièces",
  ];

  const unitPattern = UNITS.join("|");
  const fractionPart = "(?:\\d+\\s*/\\s*\\d+|\\d+[.,]\\d+|\\d+)";
  const qtyPattern = `(${fractionPart}(?:\\s*(?:à|-)\\s*${fractionPart})?)`;
  const re = new RegExp(`^${qtyPattern}\\s*(${unitPattern})\\.?\\s+(?:de\\s+|d'|du\\s+|des?\\s+)?(.+)$`, "i");

  const m = text.match(re);
  if (m) {
    return {
      quantity: parseFraction(m[1]),
      unit: m[2].toLowerCase().replace(/\s+/g, " ").trim(),
      name: m[3].trim(),
    };
  }

  const simpleRe = new RegExp(`^${qtyPattern}\\s+(?:de\\s+|d'|du\\s+|des?\\s+)?(.+)$`, "i");
  const m2 = text.match(simpleRe);
  if (m2) {
    return { quantity: parseFraction(m2[1]), unit: "pièce", name: m2[2].trim() };
  }

  return { quantity: 1, unit: "pièce", name: text };
}

function parseFraction(str: string): number {
  str = str.trim();
  if (str.includes("/")) {
    const [a, b] = str.split("/");
    return parseFloat(a) / parseFloat(b);
  }
  return parseFloat(str.replace(",", ".")) || 1;
}

function parseSteps(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") return value ? [value.trim()] : [];

  if (Array.isArray(value)) {
    const results: string[] = [];
    for (const item of value) {
      if (typeof item === "string") {
        if (item.trim()) results.push(item.trim());
      } else if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        if (obj["@type"] === "HowToSection" && Array.isArray(obj.itemListElement)) {
          results.push(...parseSteps(obj.itemListElement));
        } else if (typeof obj.text === "string" && obj.text.trim()) {
          results.push(obj.text.replace(/<[^>]*>/g, "").trim());
        } else if (typeof obj.name === "string" && obj.name.trim()) {
          results.push(obj.name.replace(/<[^>]*>/g, "").trim());
        }
      }
    }
    return results;
  }

  return [];
}
