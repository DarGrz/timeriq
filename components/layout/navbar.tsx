'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Timer, Plus, LogOut, User, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function Navbar() {
    const pathname = usePathname();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: { user: SupabaseUser | null } | null) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const isAuthPage = pathname === '/login' || pathname === '/register';

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="fixed top-0 left-0 right-0 z-50 glass"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 group">
                        <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                            <Timer className="w-5 h-5 text-accent" />
                        </div>
                        <span className="text-xl font-bold">
                            Timer<span className="text-accent">IQ</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <>
                                <Link href="/dashboard">
                                    <Button
                                        variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
                                        size="sm"
                                    >
                                        Moje timery
                                    </Button>
                                </Link>
                                <Link href="/create">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        leftIcon={<Plus className="w-4 h-4" />}
                                    >
                                        Nowy timer
                                    </Button>
                                </Link>
                                <div className="w-px h-6 bg-border mx-2" />
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                                        <User className="w-4 h-4 text-accent" />
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-card transition-colors"
                                        title="Wyloguj"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        ) : !isAuthPage ? (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" size="sm">
                                        Zaloguj się
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button variant="primary" size="sm">
                                        Rozpocznij za darmo
                                    </Button>
                                </Link>
                            </>
                        ) : null}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-card transition-colors"
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="md:hidden border-t border-border"
                >
                    <div className="px-4 py-4 space-y-2 bg-background">
                        {user ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block px-4 py-2 rounded-lg hover:bg-card transition-colors"
                                >
                                    Moje timery
                                </Link>
                                <Link
                                    href="/create"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block px-4 py-2 rounded-lg hover:bg-card transition-colors"
                                >
                                    Nowy timer
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2 rounded-lg hover:bg-card transition-colors text-foreground-muted"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Wyloguj się
                                </button>
                            </>
                        ) : !isAuthPage ? (
                            <>
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block px-4 py-2 rounded-lg hover:bg-card transition-colors"
                                >
                                    Zaloguj się
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block px-4 py-2 rounded-lg bg-accent text-white text-center"
                                >
                                    Rozpocznij za darmo
                                </Link>
                            </>
                        ) : null}
                    </div>
                </motion.div>
            )}
        </motion.nav>
    );
}
