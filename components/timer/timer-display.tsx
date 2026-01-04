'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateTimeLeft, cn } from '@/lib/utils';
import { TimeLeft, TimerType } from '@/types/database';

interface TimerDisplayProps {
    targetDate: string;
    timerType: TimerType;
    color?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showLabels?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: {
        digit: 'text-2xl sm:text-3xl',
        label: 'text-[10px]',
        separator: 'text-xl',
        box: 'w-12 h-14 sm:w-14 sm:h-16',
    },
    md: {
        digit: 'text-3xl sm:text-4xl md:text-5xl',
        label: 'text-xs',
        separator: 'text-2xl',
        box: 'w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28',
    },
    lg: {
        digit: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl',
        label: 'text-sm',
        separator: 'text-3xl',
        box: 'w-20 h-24 sm:w-24 sm:h-28 md:w-32 md:h-36 lg:w-36 lg:h-40',
    },
    xl: {
        digit: 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl',
        label: 'text-base',
        separator: 'text-4xl',
        box: 'w-24 h-28 sm:w-32 sm:h-36 md:w-40 md:h-44 lg:w-44 lg:h-48',
    },
};

interface DigitBoxProps {
    value: number;
    label: string;
    color: string;
    size: keyof typeof sizeClasses;
    prevValue?: number;
}

function DigitBox({ value, label, color, size, prevValue }: DigitBoxProps) {
    const classes = sizeClasses[size];
    const formattedValue = String(value).padStart(2, '0');
    const hasChanged = prevValue !== undefined && prevValue !== value;

    return (
        <div className="flex flex-col items-center gap-1">
            <motion.div
                className={cn(
                    'relative flex items-center justify-center rounded-xl',
                    'bg-card border border-border overflow-hidden',
                    classes.box
                )}
                style={{
                    boxShadow: `0 0 20px ${color}20`,
                    borderColor: `${color}30`,
                }}
                animate={hasChanged ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.3 }}
            >
                <AnimatePresence mode="popLayout">
                    <motion.span
                        key={formattedValue}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={cn(
                            'font-bold timer-digit',
                            classes.digit
                        )}
                        style={{ color }}
                    >
                        {formattedValue}
                    </motion.span>
                </AnimatePresence>

                {/* Glow effect */}
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)`
                    }}
                />
            </motion.div>
            <span className={cn('text-foreground-muted uppercase tracking-wider font-medium', classes.label)}>
                {label}
            </span>
        </div>
    );
}

function Separator({ size, color }: { size: keyof typeof sizeClasses; color: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 px-1">
            <motion.div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
            />
        </div>
    );
}

export function TimerDisplay({
    targetDate,
    timerType,
    color = '#ef4444',
    size = 'lg',
    showLabels = true,
    className,
}: TimerDisplayProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
        calculateTimeLeft(targetDate, timerType)
    );
    const prevTimeRef = useRef<TimeLeft>(timeLeft);

    useEffect(() => {
        const timer = setInterval(() => {
            prevTimeRef.current = timeLeft;
            setTimeLeft(calculateTimeLeft(targetDate, timerType));
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate, timerType, timeLeft]);

    const labels = {
        days: 'Dni',
        hours: 'Godz',
        minutes: 'Min',
        seconds: 'Sek',
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn('flex items-start justify-center gap-2 sm:gap-3', className)}
        >
            <DigitBox
                value={timeLeft.days}
                label={showLabels ? labels.days : ''}
                color={color}
                size={size}
                prevValue={prevTimeRef.current.days}
            />
            <Separator size={size} color={color} />
            <DigitBox
                value={timeLeft.hours}
                label={showLabels ? labels.hours : ''}
                color={color}
                size={size}
                prevValue={prevTimeRef.current.hours}
            />
            <Separator size={size} color={color} />
            <DigitBox
                value={timeLeft.minutes}
                label={showLabels ? labels.minutes : ''}
                color={color}
                size={size}
                prevValue={prevTimeRef.current.minutes}
            />
            <Separator size={size} color={color} />
            <DigitBox
                value={timeLeft.seconds}
                label={showLabels ? labels.seconds : ''}
                color={color}
                size={size}
                prevValue={prevTimeRef.current.seconds}
            />

            {/* Status indicator */}
            {timerType === 'countdown' && timeLeft.isPast && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute -top-2 -right-2 px-2 py-1 bg-accent rounded-full text-xs font-medium"
                >
                    Zakończony
                </motion.div>
            )}
        </motion.div>
    );
}
