import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="lg:pl-64 pb-16 lg:pb-0 min-h-screen transition-all duration-300">
                <div className="container mx-auto p-4 lg:p-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>
            <BottomNav />
        </div>
    );
}
