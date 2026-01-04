'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Timer } from '@/types/database';
import { TimerDisplay } from '@/components/timer/timer-display';
import { TimerForm } from '@/components/timer/timer-form';
import { TimerShare } from '@/components/timer/timer-share';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { formatDateTime, generateShareCode } from '@/lib/utils';
import {
    ArrowLeft,
    Edit3,
    Share2,
    Trash2,
    Calendar,
    Repeat,
    ArrowDown,
    ArrowUp,
    Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function TimerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [timer, setTimer] = useState<Timer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
    const [isSaving, setIsSaving] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchTimer();
    }, [params.id]);

    const fetchTimer = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('timers')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) throw error;
            setTimer(data);
        } catch (error) {
            console.error('Error fetching timer:', error);
            router.push('/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (data: Omit<Timer, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'share_code'>) => {
        if (!timer) return;
        setIsSaving(true);

        try {
            const updateData: Partial<Timer> = {
                ...data,
                updated_at: new Date().toISOString(),
            };

            // Generate share code if making public and doesn't have one
            if (data.is_public && !timer.share_code) {
                updateData.share_code = generateShareCode();
            }

            const { data: updated, error } = await supabase
                .from('timers')
                .update(updateData)
                .eq('id', timer.id)
                .select()
                .single();

            if (error) throw error;
            setTimer(updated);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating timer:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!timer) return;
        setIsDeleting(true);

        try {
            const { error } = await supabase
                .from('timers')
                .delete()
                .eq('id', timer.id);

            if (error) throw error;
            router.push('/dashboard');
        } catch (error) {
            console.error('Error deleting timer:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const repeatLabels: Record<string, string> = {
        none: 'Bez powtarzania',
        daily: 'Codziennie',
        weekly: 'Co tydzień',
        monthly: 'Co miesiąc',
        yearly: 'Co rok',
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!timer) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold mb-2">Timer nie znaleziony</h2>
                <Link href="/dashboard">
                    <Button variant="secondary">Wróć do dashboardu</Button>
                </Link>
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => setIsEditing(false)}
                        className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Anuluj edycję
                    </button>
                    <h1 className="text-3xl font-bold">Edytuj timer</h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-border rounded-2xl p-6"
                >
                    <TimerForm
                        initialData={timer}
                        onSubmit={handleUpdate}
                        onCancel={() => setIsEditing(false)}
                        isLoading={isSaving}
                    />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Wróć do dashboardu
                </Link>
            </motion.div>

            {/* Main Timer Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card variant="default" padding="lg" className="relative overflow-hidden">
                    {/* Colored accent */}
                    <div
                        className="absolute top-0 left-0 right-0 h-1.5"
                        style={{ backgroundColor: timer.color }}
                    />

                    {/* Glow */}
                    <div
                        className="absolute inset-0 opacity-5 pointer-events-none"
                        style={{
                            background: `radial-gradient(circle at 50% 0%, ${timer.color} 0%, transparent 50%)`
                        }}
                    />

                    {/* Header */}
                    <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{timer.title}</h1>
                            {timer.description && (
                                <p className="text-foreground-muted text-lg">{timer.description}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                leftIcon={<Edit3 className="w-4 h-4" />}
                            >
                                Edytuj
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowShare(true)}
                                leftIcon={<Share2 className="w-4 h-4" />}
                            >
                                Udostępnij
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDelete(true)}
                                className="text-error hover:bg-error/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Timer Display */}
                    <div className="py-8 flex justify-center">
                        <TimerDisplay
                            targetDate={timer.target_date}
                            timerType={timer.timer_type}
                            color={timer.color}
                            size="xl"
                        />
                    </div>

                    {/* Info */}
                    <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-border">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-background">
                            {timer.timer_type === 'countdown' ? (
                                <ArrowDown className="w-5 h-5 text-accent" />
                            ) : (
                                <ArrowUp className="w-5 h-5 text-accent" />
                            )}
                            <div>
                                <p className="text-sm text-foreground-muted">Typ</p>
                                <p className="font-medium">
                                    {timer.timer_type === 'countdown' ? 'Odliczanie do' : 'Czas od'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-xl bg-background">
                            <Calendar className="w-5 h-5 text-accent" />
                            <div>
                                <p className="text-sm text-foreground-muted">Data</p>
                                <p className="font-medium">{formatDateTime(timer.target_date)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-xl bg-background">
                            <Repeat className="w-5 h-5 text-accent" />
                            <div>
                                <p className="text-sm text-foreground-muted">Powtarzanie</p>
                                <p className="font-medium">{repeatLabels[timer.repeat_type]}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Share Modal */}
            {showShare && (
                <TimerShare
                    timer={timer}
                    isOpen={showShare}
                    onClose={() => setShowShare(false)}
                    onUpdate={setTimer}
                />
            )}

            {/* Delete Confirmation */}
            <Modal
                isOpen={showDelete}
                onClose={() => setShowDelete(false)}
                title="Usuń timer"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-foreground-muted">
                        Czy na pewno chcesz usunąć timer <strong>&quot;{timer.title}&quot;</strong>?
                        Ta operacja jest nieodwracalna.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setShowDelete(false)}
                            className="flex-1"
                        >
                            Anuluj
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            isLoading={isDeleting}
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            className="flex-1"
                        >
                            Usuń
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
