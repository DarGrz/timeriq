'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutSchedule } from '@/types/database';
import { AVAILABLE_EXERCISES, Exercise, ExerciseType, ExerciseResult } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
    Play,
    Pause,
    SkipForward,
    X,
    CheckCircle2,
    Clock,
    Trophy,
    Hash
} from 'lucide-react';
import { ExerciseAnimation } from './exercise-animation';

interface ActiveWorkoutProps {
    schedule: WorkoutSchedule;
    isOpen: boolean;
    onClose: () => void;
    onComplete: (completedExercises: ExerciseResult[]) => void;
}

export function ActiveWorkout({
    schedule,
    isOpen,
    onClose,
    onComplete
}: ActiveWorkoutProps) {
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [results, setResults] = useState<ExerciseResult[]>([]);
    const [currentReps, setCurrentReps] = useState<number>(0);
    const [isResting, setIsResting] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);

    const REST_TIME = 15; // Increased rest time to allow for input
    const exercises = schedule.exercises
        .map(type => AVAILABLE_EXERCISES.find(e => e.type === type))
        .filter(Boolean) as Exercise[];

    const currentExercise = exercises[currentExerciseIndex];
    const isLastExercise = currentExerciseIndex === exercises.length - 1;
    const progress = ((currentExerciseIndex + 1) / exercises.length) * 100;

    useEffect(() => {
        if (isOpen && currentExercise) {
            setTimeLeft(currentExercise.duration);
            setIsPaused(false);
        }
    }, [isOpen, currentExerciseIndex]);

    useEffect(() => {
        if (!isOpen || isPaused || timeLeft === 0) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleExerciseComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, isPaused, timeLeft]);

    const handleExerciseComplete = () => {
        if (!currentExercise) return;

        const result: ExerciseResult = {
            type: currentExercise.type,
            reps: currentReps || currentExercise.reps || 0
        };

        const newResults = [...results, result];
        setResults(newResults);

        if (isLastExercise) {
            setShowCompletion(true);
            setTimeout(() => {
                onComplete(newResults);
            }, 2000);
        } else {
            setIsResting(true);
            setTimeLeft(REST_TIME);
            // Prepare default reps for next exercise if available
            const nextEx = exercises[currentExerciseIndex + 1];
            if (nextEx) {
                setCurrentReps(nextEx.reps || 0);
            }

            setTimeout(() => {
                setIsResting(false);
                setCurrentExerciseIndex(prev => prev + 1);
            }, REST_TIME * 1000);
        }
    };

    const handleSkip = () => {
        if (isResting) return;
        handleExerciseComplete();
    };

    const handleQuit = () => {
        if (results.length > 0) {
            onComplete(results);
        } else {
            onClose();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleQuit}
            title={schedule.title}
            size="lg"
        >
            <AnimatePresence mode="wait">
                {showCompletion ? (
                    <motion.div
                        key="completion"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center py-12"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                        >
                            <Trophy className="w-20 h-20 text-accent mx-auto mb-4" />
                        </motion.div>
                        <h2 className="text-3xl font-bold mb-2">Świetna robota!</h2>
                        <p className="text-foreground-muted">
                            Ukończyłeś wszystkie {exercises.length} ćwiczenia
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="workout"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                    >
                        {/* Progress Bar */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                    Ćwiczenie {currentExerciseIndex + 1} z {exercises.length}
                                </span>
                                <span className="text-sm text-foreground-muted">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            <div className="h-2 bg-background rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-accent"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>

                        {/* Current Exercise */}
                        {currentExercise && (
                            <div className="text-center py-8">
                                <motion.div
                                    key={currentExercise.type}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="mb-8"
                                >
                                    <ExerciseAnimation
                                        type={currentExercise.type}
                                        isResting={isResting}
                                    />
                                    <h3 className="text-3xl font-bold mt-6 mb-2">
                                        {isResting ? 'Odpoczynek' : currentExercise.name}
                                    </h3>
                                    {!isResting && (
                                        <p className="text-foreground-muted max-w-md mx-auto text-lg">
                                            {currentExercise.description}
                                        </p>
                                    )}
                                </motion.div>

                                {/* Timer */}
                                <motion.div
                                    key={timeLeft}
                                    initial={{ scale: 1.1 }}
                                    animate={{ scale: 1 }}
                                    className={`
                    text-7xl font-bold mb-6
                    ${isResting ? 'text-foreground-muted' : 'text-accent'}
                  `}
                                >
                                    {formatTime(timeLeft)}
                                </motion.div>

                                {/* Reps Info */}
                                {!isResting && currentExercise.reps && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                                        <CheckCircle2 className="w-4 h-4 text-accent" />
                                        <span className="text-sm font-medium">
                                            Cel: {currentExercise.reps} powtórzeń
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Completed Exercises */}
                        {results.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2">Ukończone:</p>
                                <div className="flex flex-wrap gap-2">
                                    {results.map((result, index) => {
                                        const exercise = AVAILABLE_EXERCISES.find(e => e.type === result.type);
                                        return exercise ? (
                                            <motion.div
                                                key={`${result.type}-${index}`}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20"
                                            >
                                                <span>{exercise.icon}</span>
                                                <span className="text-xs font-bold text-success">{result.reps}</span>
                                                <CheckCircle2 className="w-3 h-3 text-success" />
                                            </motion.div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Rep Input during Rest */}
                        {isResting && currentExercise && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-center"
                            >
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <Hash className="w-4 h-4 text-accent" />
                                    <span className="text-sm font-medium">Ile powtórzeń wykonano?</span>
                                </div>
                                <div className="flex items-center justify-center gap-4">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setCurrentReps(Math.max(0, currentReps - 1))}
                                    >
                                        -
                                    </Button>
                                    <Input
                                        type="number"
                                        value={currentReps}
                                        onChange={(e) => setCurrentReps(parseInt(e.target.value) || 0)}
                                        className="w-20 text-center text-xl font-bold"
                                    />
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setCurrentReps(currentReps + 1)}
                                    >
                                        +
                                    </Button>
                                </div>
                                <p className="text-xs text-foreground-muted mt-2">
                                    Wpisz wynik dla: {currentExercise.name}
                                </p>
                            </motion.div>
                        )}

                        {/* Controls */}
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={handleQuit}
                                leftIcon={<X className="w-4 h-4" />}
                                className="flex-1"
                            >
                                Zakończ
                            </Button>

                            {!isResting && (
                                <>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsPaused(!isPaused)}
                                        leftIcon={isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                    >
                                        {isPaused ? 'Wznów' : 'Pauza'}
                                    </Button>

                                    <Button
                                        variant="secondary"
                                        onClick={handleSkip}
                                        leftIcon={<SkipForward className="w-4 h-4" />}
                                    >
                                        Pomiń
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Tips */}
                        <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                            <p className="text-sm text-foreground-muted">
                                💡 <strong>Wskazówka:</strong> Pamiętaj o prawidłowej technice wykonania ćwiczeń.
                                Lepiej zrobić mniej powtórzeń, ale poprawnie!
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Modal>
    );
}
