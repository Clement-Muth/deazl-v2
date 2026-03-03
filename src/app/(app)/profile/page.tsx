import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { getUserStores } from "@/applications/user/application/useCases/getUserStores";
import { signOut } from "@/applications/user/application/useCases/signOut";
import { StoreManager } from "@/applications/user/ui/components/storeManager";

export default async function ProfilePage() {
  await initLinguiFromCookie();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const stores = await getUserStores();

  const fullName: string = user?.user_metadata?.full_name ?? "";
  const initials = fullName.trim()
    ? fullName.trim().split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? "?");

  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <header className="px-5 pb-5 pt-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-black text-white shadow-md shadow-primary/30">
            {initials}
          </div>
          <div>
            {fullName && (
              <p className="font-bold leading-tight text-foreground">{fullName}</p>
            )}
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 pb-8">
        <StoreManager initialStores={stores} />

        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-2xl border border-red-100 bg-red-50 py-3.5 text-sm font-semibold text-red-500 transition active:scale-[0.98]"
          >
            <Trans>Sign out</Trans>
          </button>
        </form>
      </div>
    </div>
  );
}
