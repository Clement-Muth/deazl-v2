import { FeedbackButton } from "@/applications/user/ui/components/feedback/feedbackButton";
import { NavBar } from "@/applications/user/ui/components/navigation/navBar";
import { DesktopSidebar } from "@/applications/user/ui/components/navigation/desktopSidebar";
import { NotificationScheduler } from "@/applications/user/ui/components/notifications/notificationScheduler";
import { OfflineIndicator } from "@/shared/components/offlineIndicator";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <style>{`
        .deazl-sidebar { display: none; flex-direction: column; }
        @media (min-width: 768px) {
          .deazl-sidebar { display: flex !important; }
          .deazl-content { padding-left: 14rem; }
          .deazl-main { padding-bottom: 2rem !important; }
        }
      `}</style>
      <DesktopSidebar />
      <OfflineIndicator />
      <div className="deazl-content flex flex-1 flex-col" style={{ minWidth: 0 }}>
        <main className="deazl-main flex-1 pb-32 pt-safe">
          <div style={{ maxWidth: "860px", margin: "0 auto" }}>
            {children}
          </div>
        </main>
        <NavBar />
        <FeedbackButton />
        <NotificationScheduler />
      </div>
    </div>
  );
}
