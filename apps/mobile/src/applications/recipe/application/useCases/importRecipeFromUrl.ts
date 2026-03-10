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
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9",
};

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (res.ok) {
      const html = await res.text();
      if (!isBlockedPage(html)) return html;
    }
  } catch {}
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const res = await fetch(jinaUrl, { headers: { Accept: "text/html", "X-Return-Format": "html" } });
    if (res.ok) {
      const html = await res.text();
      if (!isBlockedPage(html)) return html;
    }
  } catch {}
  return null;
}

async function fetchMarkdown(url: string): Promise<string | null> {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const res = await fetch(jinaUrl, { headers: { "X-Return-Format": "markdown", "X-Timeout": "15" } });
    if (res.ok) {
      const md = await res.text();
      if (md.length > 200) return md;
    }
  } catch {}
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

  if (html) {
    const jsonLdBlocks = [...html.matchAll(/<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const block of jsonLdBlocks) {
      try {
        const parsed = JSON.parse(block[1]);
        const recipe = findRecipe(parsed);
        if (recipe) return { data: { ...recipe, sourceUrl: url.trim() } };
      } catch { continue; }
    }

    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const recipe = findRecipe(nextData) ?? findRecipeHeuristic(nextData);
        if (recipe) return { data: { ...recipe, sourceUrl: url.trim() } };
      } catch {}
    }
  }

  const markdown = await fetchMarkdown(parsedUrl.href);
  if (markdown) {
    const recipe = parseMarkdownRecipe(markdown);
    if (recipe) return { data: { ...recipe, sourceUrl: url.trim() } };
  }

  return { error: "Aucune recette trouvée sur cette page. Essaie un site comme Marmiton, 750g ou AllRecipes." };
}

function findRecipe(data: unknown): Omit<ImportedRecipe, "sourceUrl"> | null {
  if (!data || typeof data !== "object") return null;
  if (Array.isArray(data)) {
    for (const item of data) { const r = findRecipe(item); if (r) return r; }
    return null;
  }
  const obj = data as Record<string, unknown>;
  if ("@graph" in obj && Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) { const r = findRecipe(item); if (r) return r; }
  }
  const type = obj["@type"];
  if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) {
    const name = typeof obj.name === "string" ? obj.name.trim() : null;
    if (name) return {
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
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object") { const r = findRecipe(val); if (r) return r; }
  }
  return null;
}

function findRecipeHeuristic(data: unknown, depth = 0): Omit<ImportedRecipe, "sourceUrl"> | null {
  if (depth > 10 || !data || typeof data !== "object") return null;
  if (Array.isArray(data)) {
    for (const item of data) { const r = findRecipeHeuristic(item, depth + 1); if (r) return r; }
    return null;
  }
  const obj = data as Record<string, unknown>;
  const hasIngredients = Array.isArray(obj.ingredients) || Array.isArray(obj.recipeIngredient);
  const hasSteps = Array.isArray(obj.steps) || Array.isArray(obj.instructions) || Array.isArray(obj.recipeInstructions);
  if (hasIngredients && hasSteps) {
    const nameRaw = obj.name ?? obj.title ?? obj.label;
    const name = typeof nameRaw === "string" ? nameRaw.trim() : null;
    if (name && name.length > 2) return {
      name,
      description: typeof obj.description === "string" ? obj.description.trim() || null : null,
      servings: parseServings(obj.servings ?? obj.recipeYield ?? obj.yield),
      prepTimeMinutes: parseDuration(obj.prepTime) ?? parseDuration(obj.prep_time),
      cookTimeMinutes: parseDuration(obj.cookTime) ?? parseDuration(obj.cook_time),
      imageUrl: parseImage(obj.image ?? obj.imageUrl),
      ingredients: parseIngredients(obj.ingredients ?? obj.recipeIngredient),
      steps: parseSteps(obj.steps ?? obj.instructions ?? obj.recipeInstructions),
    };
  }
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object") { const r = findRecipeHeuristic(val, depth + 1); if (r) return r; }
  }
  return null;
}

function stripMdLinks(text: string): string {
  return text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim();
}

function parseMarkdownRecipe(md: string): Omit<ImportedRecipe, "sourceUrl"> | null {
  const lines = md.split("\n");
  let name: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (/^#{1,2}\s/.test(l) && l.length < 150) { name = stripMdLinks(l.replace(/^#+\s+/, "").trim()); break; }
    if (i + 1 < lines.length && /^={3,}/.test(lines[i + 1].trim()) && l.length > 2 && l.length < 150) { name = stripMdLinks(l); break; }
  }
  if (!name || name.length > 150) return null;
  const servMatch = md.match(/(\d+)\s*\n\s*personnes?/i) ?? md.match(/(\d+)\s+personnes?/i);
  const servings = servMatch ? parseInt(servMatch[1]) : 4;
  const prepMatch = md.match(/[Pp]r[eé]paration\s*[:\-–]\s*\n\s*(?:(\d+)\s*h\s*)?(\d+)\s*min/) ?? md.match(/[Pp]r[eé]paration\s*[:\-–]\s*(?:(\d+)\s*h\s*)?(\d+)\s*min/i);
  const prepTimeMinutes = prepMatch ? (parseInt(prepMatch[1] ?? "0") * 60 + parseInt(prepMatch[2])) : null;
  const cookMatch = md.match(/[Cc]uisson\s*[:\-–]\s*\n\s*(?:(\d+)\s*h\s*)?(\d+)\s*min/) ?? md.match(/[Cc]uisson\s*[:\-–]\s*(?:(\d+)\s*h\s*)?(\d+)\s*min/i);
  const cookTimeMinutes = cookMatch ? (parseInt(cookMatch[1] ?? "0") * 60 + parseInt(cookMatch[2])) : null;

  const ingredients: ImportedIngredient[] = [];
  const steps: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^- \[[ x]\]\s*$/.test(line)) {
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const next = lines[j].trim();
        if (!next || /^!\[/.test(next)) continue;
        const text = stripMdLinks(next);
        if (text.length > 1 && !/^[-+]$/.test(text)) ingredients.push(parseIngredientString(text));
        break;
      }
      continue;
    }
    if (/^[ÉE]tape\s+\d+\s*$/i.test(line)) {
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const next = lines[j].trim();
        if (!next || /^!\[/.test(next)) continue;
        if (/^[ÉE]tape\s+\d+/i.test(next)) break;
        if (next.length > 5) { steps.push(stripMdLinks(next)); }
        break;
      }
      continue;
    }
  }

  if (ingredients.length === 0) {
    const normalizedLines = lines.map((l) => l.trim()).filter(Boolean);
    const ingIdx = normalizedLines.findIndex((l) => /^#{1,4}\s*(ingr[eé]dients?)/i.test(l));
    const stepsIdx = normalizedLines.findIndex((l) => /^#{1,4}\s*(pr[eé]paration|[eé]tapes?|instructions?)/i.test(l));
    if (ingIdx >= 0) {
      const end = stepsIdx > ingIdx ? stepsIdx : normalizedLines.length;
      normalizedLines.slice(ingIdx + 1, end).filter((l) => /^[-*•]/.test(l) || /^\d/.test(l)).forEach((l) => ingredients.push(parseIngredientString(stripMdLinks(l.replace(/^[-*•]\s*/, "")))));
    }
    if (steps.length === 0 && stepsIdx >= 0) {
      normalizedLines.slice(stepsIdx + 1).filter((l) => /^[-*•\d]/.test(l) && l.length > 10).forEach((l) => steps.push(stripMdLinks(l.replace(/^(\d+[\.\)]\s*|[-*•]\s*)/, "").trim())));
    }
  }

  if (ingredients.length === 0 && steps.length === 0) return null;
  return { name, description: null, servings, prepTimeMinutes, cookTimeMinutes, imageUrl: null, ingredients, steps };
}

function parseDuration(value: unknown): number | null {
  if (!value || typeof value !== "string") return null;
  const m = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return null;
  const total = (parseInt(m[1] ?? "0") * 60) + parseInt(m[2] ?? "0");
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
  return value.map((v) => typeof v === "string" ? parseIngredientString(v) : null).filter((v): v is ImportedIngredient => v !== null);
}

function parseIngredientString(raw: string): ImportedIngredient {
  const text = raw.trim().replace(/\s+/g, " ");
  const UNITS = ["kg","g","mg","l","litre","litres","cl","ml","dl","tasse","tasses","verre","verres","c\\.?\\s*à\\s*s(?:oupe)?","c\\.?\\s*à\\s*c(?:afé)?","càs","càc","tbsp","tsp","cup","oz","lb","pincée","pincées","poignée","poignées","tranche","tranches","morceau","morceaux","botte","bottes","bouquet","bouquets","sachet","sachets","boîte","boîtes","pièce","pièces"];
  const unitPattern = UNITS.join("|");
  const fractionPart = "(?:\\d+\\s*/\\s*\\d+|\\d+[.,]\\d+|\\d+)";
  const qtyPattern = `(${fractionPart}(?:\\s*(?:à|-)\\s*${fractionPart})?)`;
  const re = new RegExp(`^${qtyPattern}\\s*(${unitPattern})\\.?\\s+(?:de\\s+|d'|du\\s+|des?\\s+)?(.+)$`, "i");
  const m = text.match(re);
  if (m) return { quantity: parseFraction(m[1]), unit: m[2].toLowerCase().trim(), name: m[3].trim() };
  const simpleRe = new RegExp(`^${qtyPattern}\\s+(?:de\\s+|d'|du\\s+|des?\\s+)?(.+)$`, "i");
  const m2 = text.match(simpleRe);
  if (m2) return { quantity: parseFraction(m2[1]), unit: "pièce", name: m2[2].trim() };
  return { quantity: 1, unit: "pièce", name: text };
}

function parseFraction(str: string): number {
  str = str.trim();
  if (str.includes("/")) { const [a, b] = str.split("/"); return parseFloat(a) / parseFloat(b); }
  return parseFloat(str.replace(",", ".")) || 1;
}

function parseSteps(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") return value ? [value.trim()] : [];
  if (Array.isArray(value)) {
    const results: string[] = [];
    for (const item of value) {
      if (typeof item === "string") { if (item.trim()) results.push(item.trim()); }
      else if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        if (obj["@type"] === "HowToSection" && Array.isArray(obj.itemListElement)) results.push(...parseSteps(obj.itemListElement));
        else if (typeof obj.text === "string" && obj.text.trim()) results.push(obj.text.replace(/<[^>]*>/g, "").trim());
        else if (typeof obj.name === "string" && obj.name.trim()) results.push(obj.name.replace(/<[^>]*>/g, "").trim());
      }
    }
    return results;
  }
  return [];
}
