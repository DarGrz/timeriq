'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { TimerForm } from '@/components/timer/timer-form';
import { Timer } from '@/types/database';
import { generateShareCode } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateTimerPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (data: Omit<Timer, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'share_code'>) => {
        if (isLoading) return; // Prevent multiple submissions
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('timers')
                .insert({
                    ...data,
                    user_id: user.id,
                });

            if (error) throw error;

            router.push('/dashboard');
            router.refresh();
        } catch (error) {
            console.error('Error creating timer:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Wróć do dashboardu
                </Link>
                <h1 className="text-3xl font-bold">Nowy timer</h1>
                <p className="text-foreground-muted mt-1">
                    Utwórz nowy timer i zacznij odliczanie
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-2xl p-6"
            >
                <TimerForm
                    onSubmit={handleSubmit}
                    onCancel={() => router.push('/dashboard')}
                    isLoading={isLoading}
                />
            </motion.div>
        </div>
    );
}
