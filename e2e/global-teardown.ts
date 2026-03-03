import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export default async function globalTeardown() {
  const envPath = path.join(process.cwd(), ".env.test");
  if (fs.existsSync(envPath)) {
    fs.unlinkSync(envPath);
  }

  if (process.env.CI) {
    execSync("bunx supabase stop", { stdio: "inherit", cwd: process.cwd() });
  }
}
