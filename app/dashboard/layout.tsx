import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Footer from "@/components/footer";
import ThemeToggle from "@/components/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "24rem",
          "--sidebar-width-mobile": "18rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <div className="flex items-center justify-between mx-7 mt-5">
          <SidebarTrigger />
          <ThemeToggle />
        </div>
        <main className="mx-20">{children}</main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}