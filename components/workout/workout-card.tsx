'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutSchedule } from '@/types/database';
import { AVAILABLE_EXERCISES } from '@/types/workout';
import { Button } from '@/components/ui/button';
import {
    Dumbbell,
    Clock,
    Calendar,
    Play,
    Pause,
    MoreVertical,
    Trash2,
    Edit,
    CheckCircle2
} from 'lucide-react';

interface WorkoutCardProps {
    schedule: WorkoutSchedule;
    onStart: (schedule: WorkoutSchedule) => void;
    onEdit?: (schedule: WorkoutSchedule) => void;
    onDelete?: (schedule: WorkoutSchedule) => void;
    onToggleActive?: (schedule: WorkoutSchedule) => void;
}

export function WorkoutCard({
    schedule,
    onStart,
    onEdit,
    onDelete,
    onToggleActive
}: WorkoutCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [nextWorkout, setNextWorkout] = useState<Date | null>(null);

    useEffect(() => {
        calculateNextWorkout();
        const interval = setInterval(calculateNextWorkout, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [schedule]);

    const calculateNextWorkout = () => {
        if (!schedule.is_active) {
            setNextWorkout(null);
            return;
        }

        const now = new Date();
        const [startHour, startMinute] = (schedule.start_time || '09:00').split(':').map(Number);
        const [endHour, endMinute] = (schedule.end_time || '17:00').split(':').map(Number);

        // Check if work days only and today is weekend
        if (schedule.work_days_only) {
            const day = now.getDay();
            if (day === 0 || day === 6) {
                // Weekend - next workout is Monday
                const daysUntilMonday = day === 0 ? 1 : 2;
                const monday = new Date(now);
                monday.setDate(monday.getDate() + daysUntilMonday);
                monday.setHours(startHour, startMinute, 0, 0);
                setNextWorkout(monday);
                return;
            }
        }

        // Calculate next workout time today
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        if (currentMinutes < startMinutes) {
            // Before start time today
            const next = new Date(now);
            next.setHours(startHour, startMinute, 0, 0);
            setNextWorkout(next);
        } else if (currentMinutes >= endMinutes) {
            // After end time - next workout is tomorrow
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(startHour, startMinute, 0, 0);
            setNextWorkout(tomorrow);
        } else {
            // During work hours - calculate next interval
            const minutesSinceStart = currentMinutes - startMinutes;
            const frequencyMinutes = schedule.frequency * 60;
            const nextInterval = Math.ceil(minutesSinceStart / frequencyMinutes) * frequencyMinutes;
            const nextMinutes = startMinutes + nextInterval;

            if (nextMinutes < endMinutes) {
                const next = new Date(now);
                next.setHours(Math.floor(nextMinutes / 60), nextMinutes % 60, 0, 0);
                setNextWorkout(next);
            } else {
                // Next workout is tomorrow
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(startHour, startMinute, 0, 0);
                setNextWorkout(tomorrow);
            }
        }
    };

    const getTimeUntilNext = () => {
        if (!nextWorkout) return null;
        const now = new Date();
        const diff = nextWorkout.getTime() - now.getTime();

        if (diff < 0) return 'Teraz!';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `za ${days}d`;
        }
        if (hours > 0) {
            return `za ${hours}h ${minutes}min`;
        }
        return `za ${minutes}min`;
    };

    const exerciseCount = schedule.exercises.length;
    const totalDailyMinutes = schedule.duration * schedule.daily_repetitions;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
        relative p-6 rounded-2xl border-2 transition-all
        ${schedule.is_active
                    ? 'bg-card border-accent/50 shadow-lg shadow-accent/10'
                    : 'bg-card/50 border-border'
                }
      `}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            ${schedule.is_active ? 'bg-accent/20' : 'bg-accent/10'}
          `}>
                        <Dumbbell className={`w-6 h-6 ${schedule.is_active ? 'text-accent' : 'text-foreground-muted'}`} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">{schedule.title}</h3>
                        <p className="text-sm text-foreground-muted">
                            {exerciseCount} {exerciseCount === 1 ? 'ćwiczenie' : 'ćwiczenia'}
                        </p>
                    </div>
                </div>

                {/* Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden"
                                >
                                    {onToggleActive && (
                                        <button
                                            onClick={() => {
                                                onToggleActive(schedule);
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors flex items-center gap-3"
                                        >
                                            {schedule.is_active ? (
                                                <>
                                                    <Pause className="w-4 h-4" />
                                                    <span>Wstrzymaj</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4" />
                                                    <span>Aktywuj</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {onEdit && (
                                        <button
                                            onClick={() => {
                                                onEdit(schedule);
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors flex items-center gap-3"
                                        >
                                            <Edit className="w-4 h-4" />
                                            <span>Edytuj</span>
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => {
                                                onDelete(schedule);
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-3"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>Usuń</span>
                                        </button>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-lg bg-background/50">
                    <Clock className="w-4 h-4 mx-auto mb-1 text-foreground-muted" />
                    <p className="text-xs text-foreground-muted">Długość</p>
                    <p className="font-semibold">{schedule.duration}min</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                    <Calendar className="w-4 h-4 mx-auto mb-1 text-foreground-muted" />
                    <p className="text-xs text-foreground-muted">Dziennie</p>
                    <p className="font-semibold">{schedule.daily_repetitions}×</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                    <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-foreground-muted" />
                    <p className="text-xs text-foreground-muted">Łącznie</p>
                    <p className="font-semibold">{totalDailyMinutes}min</p>
                </div>
            </div>

            {/* Exercise Icons */}
            <div className="flex flex-wrap gap-2 mb-4">
                {schedule.exercises.slice(0, 6).map((exerciseType) => {
                    const exercise = AVAILABLE_EXERCISES.find(e => e.type === exerciseType);
                    return exercise ? (
                        <span
                            key={exerciseType}
                            className="text-2xl"
                            title={exercise.name}
                        >
                            {exercise.icon}
                        </span>
                    ) : null;
                })}
                {schedule.exercises.length > 6 && (
                    <span className="text-sm text-foreground-muted self-center">
                        +{schedule.exercises.length - 6}
                    </span>
                )}
            </div>

            {/* Next Workout */}
            {schedule.is_active && nextWorkout && (
                <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-xs text-foreground-muted mb-1">Następny trening</p>
                    <p className="font-semibold text-accent">{getTimeUntilNext()}</p>
                </div>
            )}

            {/* Schedule Info */}
            <div className="text-xs text-foreground-muted mb-4 space-y-1">
                <p>• Co {schedule.frequency}h ({schedule.start_time} - {schedule.end_time})</p>
                {schedule.work_days_only && <p>• Tylko dni robocze</p>}
            </div>

            {/* Action Button */}
            <Button
                variant="primary"
                onClick={() => onStart(schedule)}
                leftIcon={<Play className="w-4 h-4" />}
                className="w-full"
                disabled={!schedule.is_active}
            >
                {schedule.is_active ? 'Rozpocznij trening' : 'Nieaktywny'}
            </Button>
        </motion.div>
    );
}
