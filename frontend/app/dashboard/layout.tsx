import { Navbar } from "@/components/layout/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-6 py-24 max-w-7xl">
                {children}
            </main>
        </div>
    );
}
