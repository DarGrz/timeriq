'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AVAILABLE_EXERCISES, ExerciseType } from '@/types/workout';
import { createClient } from '@/lib/supabase/client';
import {
    Dumbbell,
    Clock,
    Repeat,
    Calendar,
    Check,
    X,
    Info
} from 'lucide-react';

interface WorkoutFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function WorkoutForm({ onSuccess, onCancel }: WorkoutFormProps) {
    const [title, setTitle] = useState('Trening biurowy');
    const [duration, setDuration] = useState(5); // minuty
    const [frequency, setFrequency] = useState(1); // co ile godzin
    const [dailyReps, setDailyReps] = useState(8); // ile razy dziennie
    const [selectedExercises, setSelectedExercises] = useState<ExerciseType[]>([
        'pushups',
        'squats',
        'desk_stretch'
    ]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [workDaysOnly, setWorkDaysOnly] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const supabase = createClient();

    const toggleExercise = (exercise: ExerciseType) => {
        if (selectedExercises.includes(exercise)) {
            setSelectedExercises(selectedExercises.filter(e => e !== exercise));
        } else {
            setSelectedExercises([...selectedExercises, exercise]);
        }
    };

    const calculateTotalTime = () => {
        const totalMinutes = dailyReps * duration;
        return totalMinutes;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (selectedExercises.length === 0) {
            setError('Wybierz przynajmniej jedno ćwiczenie');
            return;
        }

        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Musisz być zalogowany');

            const { error: insertError } = await supabase
                .from('workout_schedules')
                .insert({
                    user_id: user.id,
                    title,
                    duration,
                    frequency,
                    daily_repetitions: dailyReps,
                    exercises: selectedExercises,
                    is_active: true,
                    start_time: startTime,
                    end_time: endTime,
                    work_days_only: workDaysOnly
                });

            if (insertError) throw insertError;

            onSuccess?.();
        } catch (err) {
            console.error('Error creating workout schedule:', err);
            setError('Nie udało się utworzyć planu treningowego');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Info */}
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <div className="text-sm">
                        <p className="font-medium mb-1">Przykład: Trening co godzinę przez 8h</p>
                        <p className="text-foreground-muted">
                            5 min × 8 razy = <strong className="text-accent">40 minut</strong> dziennie
                        </p>
                    </div>
                </div>
            </div>

            {/* Title */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Nazwa planu treningowego
                </label>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="np. Trening biurowy"
                    required
                />
            </div>

            {/* Duration */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Długość jednego treningu (minuty)
                </label>
                <div className="flex items-center gap-4">
                    <Input
                        type="number"
                        min="1"
                        max="30"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                        className="w-24"
                    />
                    <span className="text-sm text-foreground-muted">minut</span>
                </div>
            </div>

            {/* Frequency */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    <Repeat className="w-4 h-4 inline mr-2" />
                    Co ile godzin powtarzać
                </label>
                <div className="flex items-center gap-4">
                    <Input
                        type="number"
                        min="1"
                        max="8"
                        value={frequency}
                        onChange={(e) => setFrequency(parseInt(e.target.value) || 1)}
                        className="w-24"
                    />
                    <span className="text-sm text-foreground-muted">godzin</span>
                </div>
            </div>

            {/* Daily Repetitions */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Ile razy dziennie
                </label>
                <div className="flex items-center gap-4">
                    <Input
                        type="number"
                        min="1"
                        max="12"
                        value={dailyReps}
                        onChange={(e) => setDailyReps(parseInt(e.target.value) || 1)}
                        className="w-24"
                    />
                    <span className="text-sm text-foreground-muted">razy</span>
                </div>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Rozpoczęcie
                    </label>
                    <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Zakończenie
                    </label>
                    <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                    />
                </div>
            </div>

            {/* Work Days Only */}
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id="workDaysOnly"
                    checked={workDaysOnly}
                    onChange={(e) => setWorkDaysOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <label htmlFor="workDaysOnly" className="text-sm font-medium cursor-pointer">
                    Tylko dni robocze (poniedziałek - piątek)
                </label>
            </div>

            {/* Exercise Selection */}
            <div>
                <label className="block text-sm font-medium mb-3">
                    <Dumbbell className="w-4 h-4 inline mr-2" />
                    Wybierz ćwiczenia
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_EXERCISES.map((exercise) => {
                        const isSelected = selectedExercises.includes(exercise.type);
                        return (
                            <motion.button
                                key={exercise.type}
                                type="button"
                                onClick={() => toggleExercise(exercise.type)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`
                  p-4 rounded-xl border-2 text-left transition-all
                  ${isSelected
                                        ? 'border-accent bg-accent/10'
                                        : 'border-border bg-card hover:border-accent/50'
                                    }
                `}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{exercise.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h4 className="font-medium text-sm">{exercise.name}</h4>
                                            {isSelected && (
                                                <Check className="w-4 h-4 text-accent shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-foreground-muted line-clamp-2">
                                            {exercise.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-foreground-muted">
                                            <Clock className="w-3 h-3" />
                                            <span>{exercise.duration}s</span>
                                            {exercise.reps && (
                                                <>
                                                    <span>•</span>
                                                    <span>{exercise.reps} powtórzeń</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-card border border-border">
                <h4 className="font-medium mb-2">Podsumowanie</h4>
                <div className="space-y-1 text-sm text-foreground-muted">
                    <p>• Trening: <strong className="text-foreground">{duration} minut</strong></p>
                    <p>• Częstotliwość: <strong className="text-foreground">co {frequency}h</strong></p>
                    <p>• Powtórzeń dziennie: <strong className="text-foreground">{dailyReps}×</strong></p>
                    <p>• Łączny czas: <strong className="text-accent">{calculateTotalTime()} minut dziennie</strong></p>
                    <p>• Wybrane ćwiczenia: <strong className="text-foreground">{selectedExercises.length}</strong></p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                {onCancel && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        className="flex-1"
                    >
                        Anuluj
                    </Button>
                )}
                <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    className="flex-1"
                >
                    Utwórz plan treningowy
                </Button>
            </div>
        </form>
    );
}
