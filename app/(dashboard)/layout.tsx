import { DashboardLayoutClient } from "@/components/dashboard/DashboardLayoutClient";
import { MainContent } from "@/components/dashboard/content/MainContent";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayoutClient>
            <MainContent>{children}</MainContent>
        </DashboardLayoutClient>
    );
}
