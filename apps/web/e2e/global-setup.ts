import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

function getSupabaseStatus(): Record<string, string> {
  const raw = execSync("bunx supabase status --output env", {
    cwd: process.cwd(),
  }).toString();

  return Object.fromEntries(
    raw
      .trim()
      .split("\n")
      .map((line) => {
        const [key, ...rest] = line.split("=");
        return [key.trim(), rest.join("=").trim()];
      })
  );
}

export default async function globalSetup() {
  try {
    execSync("bunx supabase start", { stdio: "inherit", cwd: process.cwd() });
  } catch {
    // Already running
  }

  const status = getSupabaseStatus();

  const envContent = [
    `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${status.ANON_KEY}`,
    `SUPABASE_SERVICE_ROLE_KEY=${status.SERVICE_ROLE_KEY}`,
  ].join("\n");

  fs.writeFileSync(path.join(process.cwd(), ".env.test"), envContent);
}
