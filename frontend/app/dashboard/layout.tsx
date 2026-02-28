import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full bg-[#050505] overflow-hidden text-[#f0f0f0] selection:bg-[#C02B0A]/40">

            {/* Brutalist persistent sidebar */}
            <Sidebar />

            {/* Main dashboard content area */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden bg-[#0a0a0a] border-l border-[#3C091E]/10">

                {/* Subtle background industrial grid pattern */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at center, #97494E 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />

                <div className="p-8 lg:p-12 relative z-10 font-sans h-full w-full">
                    {children}
                </div>
            </main>

        </div>
    );
}
