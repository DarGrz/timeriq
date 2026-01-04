import { Navbar } from '@/components/layout/navbar';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-16 flex items-center justify-center px-4">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Background gradient effects */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
                </div>
                <div className="relative z-10 w-full py-12">
                    {children}
                </div>
            </main>
        </>
    );
}
