
import DashboardLayout from './DashboardLayout';

/**
 * SidebarLayout
 * 
 * Functions as an alias to DashboardLayout to satisfy imports in restored pages.
 * Maintains consistency across the application.
 */
export default function SidebarLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
