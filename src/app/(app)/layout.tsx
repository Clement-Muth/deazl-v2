import { FeedbackButton } from "@/applications/user/ui/components/feedback/feedbackButton";
import { NavBar } from "@/applications/user/ui/components/navigation/navBar";
import { NotificationScheduler } from "@/applications/user/ui/components/notifications/notificationScheduler";
import { OfflineIndicator } from "@/shared/components/offlineIndicator";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OfflineIndicator />
      <main className="flex-1 pb-32 pt-safe">
        {children}
      </main>
      <NavBar />
      <FeedbackButton />
      <NotificationScheduler />
    </div>
  );
}
