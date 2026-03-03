import { NavBar } from "@/applications/user/ui/components/navigation/navBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 pb-24">
        {children}
      </main>
      <NavBar />
    </div>
  );
}
