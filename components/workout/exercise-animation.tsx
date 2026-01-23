'use client';

import { motion } from 'framer-motion';
import { ExerciseType } from '@/types/workout';

interface ExerciseAnimationProps {
    type: ExerciseType;
    isResting?: boolean;
}

export function ExerciseAnimation({ type, isResting }: ExerciseAnimationProps) {
    if (isResting) {
        return (
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="text-8xl"
                >
                    😌
                </motion.div>
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.1, 0.3],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-accent/20 rounded-full blur-3xl"
                />
            </div>
        );
    }

    const renderAnimation = () => {
        switch (type) {
            case 'desk_pushups':
                return (
                    <div className="relative w-48 h-48 mx-auto border-b-4 border-foreground/20">
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-foreground/40" />
                        <motion.div
                            animate={{ rotate: [30, 15, 30] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            style={{ originX: 0, originY: 1 }}
                            className="absolute bottom-0 left-1/4 w-2 h-32 bg-accent rounded-full"
                        >
                            <div className="absolute -top-6 -left-2 w-6 h-6 bg-accent rounded-full" />
                            <div className="absolute top-4 left-0 w-16 h-1.5 bg-accent/60 rounded-full origin-left rotate-45" />
                        </motion.div>
                    </div>
                );

            case 'pushups':
                return (
                    <div className="relative w-48 h-48 mx-auto border-b-4 border-foreground/20">
                        <motion.div
                            animate={{ y: [0, 15, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center"
                        >
                            <div className="w-32 h-4 bg-accent rounded-full" />
                            <div className="flex gap-20 -mt-2">
                                <div className="w-2 h-10 bg-accent/60 rounded-full" />
                                <div className="w-2 h-10 bg-accent/60 rounded-full" />
                            </div>
                        </motion.div>
                    </div>
                );

            case 'squats':
                return (
                    <div className="relative w-48 h-48 mx-auto">
                        <motion.div
                            animate={{ y: [0, 40, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-8 h-8 bg-accent rounded-full mb-1" />
                            <div className="w-3 h-20 bg-accent rounded-full" />
                            <div className="flex gap-4 -mt-2">
                                <div className="w-2.5 h-16 bg-accent/70 rounded-full origin-top rotate-12" />
                                <div className="w-2.5 h-16 bg-accent/70 rounded-full origin-top -rotate-12" />
                            </div>
                        </motion.div>
                        <div className="absolute bottom-4 left-0 w-full h-1 bg-foreground/10 rounded-full" />
                    </div>
                );

            case 'lunges':
                return (
                    <div className="relative w-48 h-48 mx-auto">
                        <motion.div
                            animate={{ x: [-20, 20, -20], y: [0, 20, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="flex flex-col items-center pt-8"
                        >
                            <div className="w-8 h-8 bg-accent rounded-full mb-1" />
                            <div className="w-3 h-20 bg-accent rounded-full" />
                            <div className="flex gap-16 -mt-2">
                                <div className="w-2.5 h-16 bg-accent/70 rounded-full origin-top" />
                            </div>
                        </motion.div>
                        <div className="absolute bottom-2 left-0 w-full h-1 bg-foreground/10" />
                    </div>
                );

            case 'burpees':
                return (
                    <div className="relative w-48 h-48 mx-auto">
                        <motion.div
                            animate={{
                                y: [0, 60, 60, 0, -30, 0],
                                rotate: [0, 0, 90, 0, 0, 0],
                                scaleY: [1, 1, 0.4, 1, 1, 1]
                            }}
                            transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
                            className="flex flex-col items-center pt-4"
                        >
                            <div className="w-8 h-8 bg-accent rounded-full" />
                            <div className="w-4 h-24 bg-accent rounded-full" />
                        </motion.div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-foreground/10" />
                    </div>
                );

            case 'crunches':
                return (
                    <div className="relative w-48 h-48 mx-auto border-b-4 border-foreground/10">
                        {/* Legs (static support) */}
                        <div className="absolute bottom-2 right-8 w-16 h-12 border-l-4 border-t-4 border-accent/30 rounded-tr-2xl" />
                        {/* Torso & Head (moving) */}
                        <motion.div
                            animate={{ rotate: [0, -40, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            style={{ originX: 0, originY: 1 }}
                            className="absolute bottom-2 left-8 w-24 h-4 bg-accent rounded-full"
                        >
                            <div className="absolute -top-6 right-0 w-8 h-8 bg-accent rounded-full" />
                        </motion.div>
                    </div>
                );

            case 'toe_touches':
                return (
                    <div className="relative w-48 h-48 mx-auto flex flex-col items-center pt-12">
                        <div className="w-24 h-4 bg-foreground/20 rounded-full mb-8" /> {/* Chair/Base */}
                        <motion.div
                            animate={{ rotate: [0, 60, -60, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-6 h-6 bg-accent rounded-full" />
                            <div className="w-2 h-16 bg-accent rounded-full" />
                            <div className="flex gap-12 -mt-2">
                                <div className="w-1.5 h-16 bg-accent/60 rounded-full" />
                                <div className="w-1.5 h-16 bg-accent/60 rounded-full" />
                            </div>
                        </motion.div>
                    </div>
                );

            case 'chair_twists':
                return (
                    <div className="relative w-48 h-48 mx-auto flex bg-accent/5 rounded-full items-center justify-center">
                        <motion.div
                            animate={{ rotateY: [0, 45, -45, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-10 h-10 bg-accent rounded-full mb-2" />
                            <div className="w-16 h-24 bg-accent/80 rounded-2xl relative">
                                <div className="absolute -left-4 top-2 w-4 h-16 bg-accent/40 rounded-full" />
                                <div className="absolute -right-4 top-2 w-4 h-16 bg-accent/40 rounded-full" />
                            </div>
                        </motion.div>
                    </div>
                );

            case 'eye_rest':
                return (
                    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                        <div className="flex gap-8">
                            {[1, 2].map((i) => (
                                <div key={i} className="w-12 h-12 border-4 border-accent rounded-full relative overflow-hidden">
                                    <motion.div
                                        animate={{
                                            x: [-10, 10, -10],
                                            y: [-5, 5, -5]
                                        }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-foreground rounded-full"
                                    />
                                </div>
                            ))}
                        </div>
                        <motion.div
                            animate={{ opacity: [0, 0.5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 border-8 border-accent/20 rounded-full"
                        />
                    </div>
                );

            case 'calf_raises':
                return (
                    <div className="relative w-48 h-48 mx-auto">
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="flex flex-col items-center pt-4"
                        >
                            <div className="w-8 h-8 bg-accent rounded-full mb-1" />
                            <div className="w-3 h-24 bg-accent rounded-full" />
                            <div className="flex gap-4">
                                <motion.div
                                    animate={{ rotate: [0, 20, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="w-2.5 h-12 bg-accent/70 rounded-full origin-top"
                                />
                                <motion.div
                                    animate={{ rotate: [0, -20, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="w-2.5 h-12 bg-accent/70 rounded-full origin-top"
                                />
                            </div>
                        </motion.div>
                    </div>
                );

            case 'neck_rolls':
                return (
                    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                        <div className="relative pt-12">
                            <div className="w-16 h-24 bg-accent/20 rounded-2xl" />
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-accent rounded-full"
                            >
                                <div className="absolute top-2 left-2 w-2 h-2 bg-white/50 rounded-full" />
                            </motion.div>
                        </div>
                    </div>
                );

            default:
                return (
                    <motion.div
                        animate={{ scale: [0.9, 1.1, 0.9] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-48 h-48 mx-auto bg-accent/10 rounded-full flex items-center justify-center text-7xl"
                    >
                        ⚡
                    </motion.div>
                );
        }
    };

    return (
        <div className="p-8 bg-card/50 rounded-3xl border border-border backdrop-blur-sm shadow-inner group overflow-hidden">
            {renderAnimation()}
        </div>
    );
}
