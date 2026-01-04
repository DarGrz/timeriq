'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Timer } from '@/types/database';
import { TimerCard } from '@/components/timer/timer-card';
import { TimerShare } from '@/components/timer/timer-share';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Clock, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const [timers, setTimers] = useState<Timer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'countdown' | 'countup'>('all');
    const [shareTimer, setShareTimer] = useState<Timer | null>(null);
    const [deleteTimer, setDeleteTimer] = useState<Timer | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchTimers();
    }, []);

    const fetchTimers = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('timers')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTimers(data || []);
        } catch (error) {
            console.error('Error fetching timers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTimer) return;
        setIsDeleting(true);

        try {
            const { error } = await supabase
                .from('timers')
                .delete()
                .eq('id', deleteTimer.id);

            if (error) throw error;
            setTimers(timers.filter(t => t.id !== deleteTimer.id));
            setDeleteTimer(null);
        } catch (error) {
            console.error('Error deleting timer:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleTimerUpdate = (updatedTimer: Timer) => {
        setTimers(timers.map(t => t.id === updatedTimer.id ? updatedTimer : t));
    };

    const filteredTimers = timers.filter(timer => {
        const matchesSearch = timer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            timer.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'all' || timer.timer_type === filterType;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold">Moje timery</h1>
                    <p className="text-foreground-muted mt-1">
                        Zarządzaj swoimi timerami i udostępniaj je znajomym
                    </p>
                </div>
                <Link href="/create">
                    <Button
                        variant="primary"
                        leftIcon={<Plus className="w-4 h-4" />}
                    >
                        Nowy timer
                    </Button>
                </Link>
            </motion.div>

            {/* Search and Filters */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <div className="flex-1">
                    <Input
                        placeholder="Szukaj timerów..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        leftIcon={<Search className="w-4 h-4" />}
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filterType === 'all' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFilterType('all')}
                    >
                        Wszystkie
                    </Button>
                    <Button
                        variant={filterType === 'countdown' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFilterType('countdown')}
                    >
                        Odliczanie
                    </Button>
                    <Button
                        variant={filterType === 'countup' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFilterType('countup')}
                    >
                        Od daty
                    </Button>
                </div>
            </motion.div>

            {/* Timers Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
            ) : filteredTimers.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredTimers.map((timer, index) => (
                            <TimerCard
                                key={timer.id}
                                timer={timer}
                                index={index}
                                onShare={setShareTimer}
                                onDelete={setDeleteTimer}
                                onEdit={(t) => window.location.href = `/timer/${t.id}?edit=true`}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20"
                >
                    <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-10 h-10 text-accent" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">
                        {searchQuery ? 'Brak wyników' : 'Brak timerów'}
                    </h2>
                    <p className="text-foreground-muted mb-6">
                        {searchQuery
                            ? 'Spróbuj innego wyszukiwania'
                            : 'Utwórz swój pierwszy timer i zacznij odliczanie!'}
                    </p>
                    {!searchQuery && (
                        <Link href="/create">
                            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                                Utwórz timer
                            </Button>
                        </Link>
                    )}
                </motion.div>
            )}

            {/* Share Modal */}
            {shareTimer && (
                <TimerShare
                    timer={shareTimer}
                    isOpen={!!shareTimer}
                    onClose={() => setShareTimer(null)}
                    onUpdate={handleTimerUpdate}
                />
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteTimer}
                onClose={() => setDeleteTimer(null)}
                title="Usuń timer"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-foreground-muted">
                        Czy na pewno chcesz usunąć timer <strong>&quot;{deleteTimer?.title}&quot;</strong>?
                        Ta operacja jest nieodwracalna.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setDeleteTimer(null)}
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
