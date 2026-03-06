import Link from "next/link";
import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { getUserStores } from "@/applications/user/application/useCases/getUserStores";
import { signOut } from "@/applications/user/application/useCases/signOut";
import { StoreManager } from "@/applications/user/ui/components/storeManager";
import { AvatarPicker } from "@/applications/user/ui/components/avatarPicker";
import { HouseholdSizeEditor } from "@/applications/user/ui/components/householdSizeEditor";
import { DietaryPreferencesEditor } from "@/applications/user/ui/components/dietaryPreferencesEditor";
import { DisplayNameEditor } from "@/applications/user/ui/components/displayNameEditor";

export default async function ProfilePage() {
  await initLinguiFromCookie();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const stores = await getUserStores();

  const fullName: string = user?.user_metadata?.full_name ?? "";
  const initials = fullName.trim()
    ? fullName.trim().split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? "?");
  const avatarUrl: string | null = user?.user_metadata?.avatar_url ?? null;
  const householdSize: number = user?.user_metadata?.household_size ?? 2;
  const dietaryPreferences: string[] = user?.user_metadata?.dietary_preferences ?? [];

  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <div className="flex flex-col items-center px-5 pb-6 pt-10 text-center">
        <AvatarPicker initials={initials} avatarUrl={avatarUrl} />
        {fullName && (
          <p className="mt-5 text-xl font-black leading-tight text-foreground">{fullName}</p>
        )}
        <p className={`text-sm text-muted-foreground ${fullName ? "mt-0.5" : "mt-5"}`}>{user?.email}</p>
      </div>

      <div className="flex flex-col gap-4 px-4 py-5 pb-8">
        <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
          <DisplayNameEditor initialName={fullName} />
          <div className="mx-4 h-px bg-border/50" />
          <HouseholdSizeEditor initialSize={householdSize} />
          <div className="mx-4 h-px bg-border/50" />
          <DietaryPreferencesEditor initialPreferences={dietaryPreferences} />
        </div>

        <Link
          href="/analytics"
          className="flex items-center justify-between rounded-2xl bg-card px-4 py-4 shadow-[0_1px_4px_rgba(28,25,23,0.08)] transition active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Insights</p>
              <p className="text-xs text-muted-foreground">Stats & top recettes</p>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        <StoreManager initialStores={stores} />

        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-2xl border border-destructive/15 bg-destructive-light py-3.5 text-sm font-semibold text-destructive transition active:scale-[0.98]"
          >
            <Trans>Sign out</Trans>
          </button>
        </form>
      </div>
    </div>
  );
}
