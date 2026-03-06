import { NavBar } from "@/applications/user/ui/components/navigation/navBar";
import { NotificationScheduler } from "@/applications/user/ui/components/notifications/notificationScheduler";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 pb-32 pt-safe">
        {children}
      </main>
      <NavBar />
      <NotificationScheduler />
    </div>
  );
}
