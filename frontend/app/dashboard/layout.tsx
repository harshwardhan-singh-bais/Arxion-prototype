import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full bg-[#0b0f19] overflow-hidden text-[#f0f0f0] selection:bg-[#ef4444]/40">

            {/* Brutalist persistent sidebar */}
            <Sidebar />

            {/* Main dashboard content area */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden bg-[#0d111c] border-l border-[#1e293b]/10">

                {/* Subtle background industrial grid pattern */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay"
                    style={{ backgroundImage: 'radial-gradient(circle at center, #1e293b 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />

                {/* Radial Glow Overlay */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0d111c]/0 to-transparent" />

                <div className="p-8 lg:p-12 relative z-10 font-sans h-full w-full">
                    {children}
                </div>
            </main>

        </div>
    );
}
