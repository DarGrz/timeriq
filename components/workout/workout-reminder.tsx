'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { WorkoutSchedule } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Dumbbell, X, Bell, Play } from 'lucide-react';
import { ActiveWorkout } from './active-workout';
import { ExerciseType, ExerciseResult } from '@/types/workout';

export function WorkoutReminder() {
    const [activeSchedules, setActiveSchedules] = useState<WorkoutSchedule[]>([]);
    const [reminderSchedule, setReminderSchedule] = useState<WorkoutSchedule | null>(null);
    const [workoutToStart, setWorkoutToStart] = useState<WorkoutSchedule | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchSchedules();
        const interval = setInterval(checkWorkouts, 30000); // Sprawdzaj co 30 sekund
        return () => clearInterval(interval);
    }, []);

    const fetchSchedules = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('workout_schedules')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true);

        if (data) setActiveSchedules(data);
    };

    const checkWorkouts = () => {
        if (activeSchedules.length === 0 || reminderSchedule || workoutToStart) return;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (const schedule of activeSchedules) {
            const [startHour, startMinute] = (schedule.start_time || '09:00').split(':').map(Number);
            const [endHour, endMinute] = (schedule.end_time || '17:00').split(':').map(Number);

            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;

            // Sprawdź czy jesteśmy w oknie czasowym
            if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
                const minutesSinceStart = currentMinutes - startMinutes;
                const frequencyMinutes = schedule.frequency * 60;

                // Jeśli jesteśmy dokładnie w punkcie interwału (tolerancja 1 min)
                if (minutesSinceStart % frequencyMinutes === 0 && minutesSinceStart > 0) {
                    triggerReminder(schedule);
                    break;
                }
            }
        }
    };

    const triggerReminder = (schedule: WorkoutSchedule) => {
        // Graj dźwięk powiadomienia (opcjonalnie)
        try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => { });
        } catch (e) { }

        setReminderSchedule(schedule);

        // Auto-ukrywanie po 5 minutach jeśli użytkownik nie zareaguje
        setTimeout(() => {
            setReminderSchedule(null);
        }, 5 * 60 * 1000);
    };

    const handleWorkoutComplete = async (completedExercises: ExerciseResult[]) => {
        if (!workoutToStart) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('workout_sessions')
                .insert({
                    schedule_id: workoutToStart.id,
                    user_id: user.id,
                    scheduled_time: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                    exercises_completed: completedExercises,
                    skipped: false
                });
        } catch (error) {
            console.error('Error saving session:', error);
        } finally {
            setWorkoutToStart(null);
        }
    };

    return (
        <>
            <AnimatePresence>
                {reminderSchedule && (
                    <motion.div
                        initial={{ opacity: 0, x: 100, y: 0 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed bottom-6 right-6 z-[100] w-full max-w-sm"
                    >
                        <div className="bg-card border-2 border-accent shadow-2xl rounded-2xl p-5 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-accent" />

                            <button
                                onClick={() => setReminderSchedule(null)}
                                className="absolute top-4 right-4 text-foreground-muted hover:text-foreground"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                                    <Bell className="w-6 h-6 text-accent animate-bounce" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg leading-tight">Czas na trening!</h4>
                                    <p className="text-sm text-foreground-muted mt-1">
                                        Plan: <span className="text-foreground font-medium">{reminderSchedule.title}</span>
                                    </p>
                                    <p className="text-xs text-foreground-muted mt-2">
                                        5 minut ruchu poprawi Twoją koncentrację!
                                    </p>

                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            leftIcon={<Play className="w-4 h-4" />}
                                            onClick={() => {
                                                setWorkoutToStart(reminderSchedule);
                                                setReminderSchedule(null);
                                            }}
                                        >
                                            Zacznij teraz
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setReminderSchedule(null)}
                                        >
                                            Pomiń
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {workoutToStart && (
                <ActiveWorkout
                    schedule={workoutToStart}
                    isOpen={!!workoutToStart}
                    onClose={() => setWorkoutToStart(null)}
                    onComplete={handleWorkoutComplete}
                />
            )}
        </>
    );
}
