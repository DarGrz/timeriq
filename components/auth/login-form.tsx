'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, LogIn } from 'lucide-react';
import Link from 'next/link';

export function LoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    setError('Nieprawidłowy email lub hasło');
                } else {
                    setError(error.message);
                }
                return;
            }

            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            setError('Wystąpił błąd podczas logowania');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
        >
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Witaj ponownie!</h1>
                <p className="text-foreground-muted">
                    Zaloguj się, aby zarządzać swoimi timerami
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                <Input
                    type="email"
                    label="Email"
                    placeholder="twoj@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    leftIcon={<Mail className="w-4 h-4" />}
                    required
                />

                <Input
                    type="password"
                    label="Hasło"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    leftIcon={<Lock className="w-4 h-4" />}
                    required
                />

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    leftIcon={<LogIn className="w-4 h-4" />}
                    className="w-full"
                >
                    Zaloguj się
                </Button>
            </form>

            <p className="text-center text-foreground-muted mt-6">
                Nie masz konta?{' '}
                <Link href="/register" className="text-accent hover:underline font-medium">
                    Zarejestruj się
                </Link>
            </p>
        </motion.div>
    );
}
