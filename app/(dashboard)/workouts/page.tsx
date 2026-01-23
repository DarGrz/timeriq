'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { WorkoutSchedule, WorkoutSession } from '@/types/database';
import { ExerciseType, ExerciseResult } from '@/types/workout';
import { WorkoutCard } from '@/components/workout/workout-card';
import { WorkoutForm } from '@/components/workout/workout-form';
import { ActiveWorkout } from '@/components/workout/active-workout';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Dumbbell,
    Loader2,
    TrendingUp,
    Calendar,
    Flame,
    Trophy,
    History,
    CheckCircle
} from 'lucide-react';
import { AVAILABLE_EXERCISES } from '@/types/workout';

export default function WorkoutsPage() {
    const [schedules, setSchedules] = useState<WorkoutSchedule[]>([]);
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeWorkout, setActiveWorkout] = useState<WorkoutSchedule | null>(null);
    const [deleteSchedule, setDeleteSchedule] = useState<WorkoutSchedule | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch schedules
            const { data: schedulesData, error: schedulesError } = await supabase
                .from('workout_schedules')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (schedulesError) throw schedulesError;
            setSchedules(schedulesData || []);

            // Fetch recent sessions (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: sessionsData, error: sessionsError } = await supabase
                .from('workout_sessions')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false });

            if (sessionsError) throw sessionsError;
            setSessions(sessionsData || []);
        } catch (error) {
            console.error('Error fetching workout data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        setShowCreateForm(false);
        fetchData();
    };

    const handleToggleActive = async (schedule: WorkoutSchedule) => {
        try {
            const { error } = await supabase
                .from('workout_schedules')
                .update({ is_active: !schedule.is_active })
                .eq('id', schedule.id);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error toggling schedule:', error);
        }
    };

    const handleDelete = async () => {
        if (!deleteSchedule) return;
        setIsDeleting(true);

        try {
            const { error } = await supabase
                .from('workout_schedules')
                .delete()
                .eq('id', deleteSchedule.id);

            if (error) throw error;
            setSchedules(schedules.filter(s => s.id !== deleteSchedule.id));
            setDeleteSchedule(null);
        } catch (error) {
            console.error('Error deleting schedule:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleWorkoutComplete = async (completedExercises: ExerciseResult[]) => {
        if (!activeWorkout) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('workout_sessions')
                .insert({
                    schedule_id: activeWorkout.id,
                    user_id: user.id,
                    scheduled_time: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                    exercises_completed: completedExercises,
                    skipped: false
                });

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error saving workout session:', error);
        } finally {
            setActiveWorkout(null);
        }
    };

    // Calculate stats
    const totalWorkouts = sessions.filter(s => s.completed_at && !s.skipped).length;
    const thisWeekWorkouts = sessions.filter(s => {
        if (!s.completed_at || s.skipped) return false;
        const sessionDate = new Date(s.completed_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sessionDate >= weekAgo;
    }).length;

    const currentStreak = calculateStreak();

    function calculateStreak(): number {
        const completedSessions = sessions
            .filter(s => s.completed_at && !s.skipped)
            .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());

        if (completedSessions.length === 0) return 0;

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const session of completedSessions) {
            const sessionDate = new Date(session.completed_at!);
            sessionDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === streak || (streak === 0 && diffDays <= 1)) {
                streak = diffDays + 1;
            } else {
                break;
            }
        }

        return streak;
    }

    const activeSchedules = schedules.filter(s => s.is_active);

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Dumbbell className="w-8 h-8 text-accent" />
                        Ćwiczenia biurowe
                    </h1>
                    <p className="text-foreground-muted mt-1">
                        Zadbaj o zdrowie podczas pracy - krótkie treningi co godzinę
                    </p>
                </div>
                <Button
                    variant="primary"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowCreateForm(true)}
                >
                    Nowy plan treningowy
                </Button>
            </motion.div>

            {/* Stats */}
            {!isLoading && sessions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                    <div className="p-6 rounded-2xl bg-card border border-border">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalWorkouts}</p>
                                <p className="text-sm text-foreground-muted">Ukończonych treningów</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-card border border-border">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{thisWeekWorkouts}</p>
                                <p className="text-sm text-foreground-muted">W tym tygodniu</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-card border border-border">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                <Flame className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{currentStreak}</p>
                                <p className="text-sm text-foreground-muted">Dni z rzędu</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Schedules Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
            ) : schedules.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {activeSchedules.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-accent" />
                                Aktywne plany
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {activeSchedules.map((schedule) => (
                                        <WorkoutCard
                                            key={schedule.id}
                                            schedule={schedule}
                                            onStart={setActiveWorkout}
                                            onDelete={setDeleteSchedule}
                                            onToggleActive={handleToggleActive}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {schedules.filter(s => !s.is_active).length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-foreground-muted">
                                Nieaktywne plany
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {schedules.filter(s => !s.is_active).map((schedule) => (
                                        <WorkoutCard
                                            key={schedule.id}
                                            schedule={schedule}
                                            onStart={setActiveWorkout}
                                            onDelete={setDeleteSchedule}
                                            onToggleActive={handleToggleActive}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20"
                >
                    <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                        <Dumbbell className="w-10 h-10 text-accent" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">
                        Brak planów treningowych
                    </h2>
                    <p className="text-foreground-muted mb-6 max-w-md mx-auto">
                        Stwórz swój pierwszy plan treningowy i zacznij dbać o zdrowie podczas pracy!
                    </p>
                    <Button
                        variant="primary"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => setShowCreateForm(true)}
                    >
                        Utwórz plan treningowy
                    </Button>
                </motion.div>
            )}

            {/* History Section */}
            {!isLoading && sessions.length > 0 && (
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                >
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <History className="w-5 h-5 text-accent" />
                        Ostatnia aktywność
                    </h2>
                    <div className="space-y-3">
                        {sessions.slice(0, 5).map((session) => (
                            <div
                                key={session.id}
                                className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-accent/5 flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-5 h-5 text-success" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {schedules.find(s => s.id === session.schedule_id)?.title || 'Trening'}
                                        </p>
                                        <p className="text-xs text-foreground-muted">
                                            {new Date(session.completed_at!).toLocaleString('pl-PL', {
                                                day: '2-digit',
                                                month: 'long',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {session.exercises_completed.map((result, i) => {
                                        const exercise = AVAILABLE_EXERCISES.find(e => e.type === result.type);
                                        return (
                                            <div
                                                key={i}
                                                className="px-2 py-1 rounded bg-background border border-border text-xs flex items-center gap-1"
                                                title={exercise?.name}
                                            >
                                                <span>{exercise?.icon}</span>
                                                <span className="font-bold">{result.reps}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.section>
            )}

            {/* Create Form Modal */}
            <Modal
                isOpen={showCreateForm}
                onClose={() => setShowCreateForm(false)}
                title="Nowy plan treningowy"
                size="lg"
            >
                <WorkoutForm
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setShowCreateForm(false)}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteSchedule}
                onClose={() => setDeleteSchedule(null)}
                title="Usuń plan treningowy"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-foreground-muted">
                        Czy na pewno chcesz usunąć plan <strong>&quot;{deleteSchedule?.title}&quot;</strong>?
                        Ta operacja jest nieodwracalna.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setDeleteSchedule(null)}
                            className="flex-1"
                        >
                            Anuluj
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            isLoading={isDeleting}
                            className="flex-1"
                        >
                            Usuń
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Active Workout Modal */}
            {activeWorkout && (
                <ActiveWorkout
                    schedule={activeWorkout}
                    isOpen={!!activeWorkout}
                    onClose={() => setActiveWorkout(null)}
                    onComplete={handleWorkoutComplete}
                />
            )}
        </div>
    );
}
