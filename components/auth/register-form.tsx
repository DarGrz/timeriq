'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import Link from 'next/link';

export function RegisterForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
    });

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Hasła nie są identyczne');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Hasło musi mieć minimum 6 znaków');
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        display_name: formData.displayName,
                    },
                },
            });

            if (error) {
                if (error.message.includes('already registered')) {
                    setError('Ten email jest już zarejestrowany');
                } else {
                    setError(error.message);
                }
                return;
            }

            // If email confirmation is required
            if (data.user && !data.session) {
                setSuccess(true);
            } else {
                // If no email confirmation needed
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err) {
            setError('Wystąpił błąd podczas rejestracji');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md text-center"
            >
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-10 h-10 text-success" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Sprawdź swoją skrzynkę!</h1>
                <p className="text-foreground-muted mb-6">
                    Wysłaliśmy link aktywacyjny na adres <strong>{formData.email}</strong>.
                    Kliknij w link, aby aktywować konto.
                </p>
                <Link href="/login">
                    <Button variant="secondary">
                        Wróć do logowania
                    </Button>
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
        >
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Utwórz konto</h1>
                <p className="text-foreground-muted">
                    Dołącz do TimerIQ i zarządzaj swoimi timerami
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
                    type="text"
                    label="Imię / Nazwa"
                    placeholder="Jak mamy się do Ciebie zwracać?"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    leftIcon={<User className="w-4 h-4" />}
                />

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
                    placeholder="Minimum 6 znaków"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    leftIcon={<Lock className="w-4 h-4" />}
                    hint="Minimum 6 znaków"
                    required
                />

                <Input
                    type="password"
                    label="Potwierdź hasło"
                    placeholder="Powtórz hasło"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    leftIcon={<Lock className="w-4 h-4" />}
                    required
                />

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    leftIcon={<UserPlus className="w-4 h-4" />}
                    className="w-full"
                >
                    Zarejestruj się
                </Button>
            </form>

            <p className="text-center text-foreground-muted mt-6">
                Masz już konto?{' '}
                <Link href="/login" className="text-accent hover:underline font-medium">
                    Zaloguj się
                </Link>
            </p>
        </motion.div>
    );
}
