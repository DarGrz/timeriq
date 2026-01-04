'use client';

import { motion } from 'framer-motion';
import { Timer } from '@/types/database';
import { TimerDisplay } from '@/components/timer/timer-display';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { Timer as TimerIcon, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface PublicTimerViewProps {
    timer: Timer;
}

export function PublicTimerView({ timer }: PublicTimerViewProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse at 50% 30%, ${timer.color} 0%, transparent 60%)`
                }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)]" />

            {/* Floating particles */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{ backgroundColor: timer.color }}
                    initial={{
                        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                        opacity: 0,
                    }}
                    animate={{
                        y: [null, Math.random() * -200 - 100],
                        opacity: [0, 0.5, 0],
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        delay: Math.random() * 5,
                    }}
                />
            ))}

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative z-10 text-center max-w-4xl w-full"
            >
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-center gap-2 mb-8"
                >
                    <div className="p-2 rounded-lg bg-accent/10">
                        <TimerIcon className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-xl font-bold">
                        Timer<span className="text-accent">IQ</span>
                    </span>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4"
                    style={{
                        textShadow: `0 0 40px ${timer.color}40`
                    }}
                >
                    {timer.title}
                </motion.h1>

                {timer.description && (
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-xl text-foreground-muted mb-8 max-w-2xl mx-auto"
                    >
                        {timer.description}
                    </motion.p>
                )}

                {/* Timer */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="py-12"
                >
                    <TimerDisplay
                        targetDate={timer.target_date}
                        timerType={timer.timer_type}
                        color={timer.color}
                        size="xl"
                    />
                </motion.div>

                {/* Date Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-center gap-2 text-foreground-muted mb-12"
                >
                    <Calendar className="w-4 h-4" />
                    <span>
                        {timer.timer_type === 'countdown' ? 'Odliczanie do' : 'Czas od'}: {formatDateTime(timer.target_date)}
                    </span>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <Link href="/register">
                        <Button
                            variant="primary"
                            size="lg"
                            rightIcon={<ExternalLink className="w-4 h-4" />}
                            className="animate-pulse-glow"
                        >
                            Stwórz własny timer za darmo
                        </Button>
                    </Link>
                </motion.div>
            </motion.div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-4 text-center text-sm text-foreground-muted"
            >
                Powered by <span className="text-accent">TimerIQ</span>
            </motion.div>
        </div>
    );
}
