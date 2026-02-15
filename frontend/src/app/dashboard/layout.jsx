import SidebarNav from "@/components/SidebarNav";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      {/* LEFT NAV */}
      <SidebarNav />

      {/* MAIN CONTENT */}
      <div className="flex-1 min-h-screen">{children}</div>
    </div>
  );
}
