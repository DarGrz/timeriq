'use client';

import { motion } from 'framer-motion';
import { Timer, TimerType } from '@/types/database';
import { Card } from '@/components/ui/card';
import { TimerDisplay } from './timer-display';
import { formatDate, cn } from '@/lib/utils';
import {
    Clock,
    Calendar,
    Share2,
    MoreVertical,
    Repeat,
    ArrowUp,
    ArrowDown,
    Trash2,
    Edit3,
    Copy,
    Eye
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface TimerCardProps {
    timer: Timer;
    index?: number;
    onShare?: (timer: Timer) => void;
    onEdit?: (timer: Timer) => void;
    onDelete?: (timer: Timer) => void;
}

export function TimerCard({ timer, index = 0, onShare, onEdit, onDelete }: TimerCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    const repeatLabels: Record<string, string> = {
        none: '',
        daily: 'Codziennie',
        weekly: 'Co tydzień',
        monthly: 'Co miesiąc',
        yearly: 'Co rok',
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{
                duration: 0.4,
                delay: index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94]
            }}
            layout
        >
            <Card
                variant="default"
                hover
                className="group relative overflow-hidden"
            >
                {/* Colored accent line */}
                <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: timer.color }}
                />

                {/* Glow effect on hover */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at 50% 0%, ${timer.color} 0%, transparent 60%)`
                    }}
                />

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <Link href={`/timer/${timer.id}`}>
                            <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                                {timer.title}
                            </h3>
                        </Link>
                        {timer.description && (
                            <p className="text-sm text-foreground-muted mt-1 line-clamp-2">
                                {timer.description}
                            </p>
                        )}
                    </div>

                    {/* Menu */}
                    <div className="relative ml-2">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                    className="absolute right-0 top-full mt-1 z-20 min-w-[160px] py-1 bg-card border border-border rounded-lg shadow-lg"
                                >
                                    <Link
                                        href={`/timer/${timer.id}`}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background transition-colors"
                                        onClick={() => setShowMenu(false)}
                                    >
                                        <Eye className="w-4 h-4" />
                                        Szczegóły
                                    </Link>
                                    <button
                                        onClick={() => {
                                            onEdit?.(timer);
                                            setShowMenu(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-background transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Edytuj
                                    </button>
                                    <button
                                        onClick={() => {
                                            onShare?.(timer);
                                            setShowMenu(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-background transition-colors"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Udostępnij
                                    </button>
                                    {timer.share_code && (
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/share/${timer.share_code}`);
                                                setShowMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-background transition-colors"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Kopiuj link
                                        </button>
                                    )}
                                    <div className="h-px bg-border my-1" />
                                    <button
                                        onClick={() => {
                                            onDelete?.(timer);
                                            setShowMenu(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Usuń
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </div>
                </div>

                {/* Timer Display */}
                <div className="py-4">
                    <TimerDisplay
                        targetDate={timer.target_date}
                        timerType={timer.timer_type}
                        color={timer.color}
                        size="sm"
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-sm text-foreground-muted">
                        <div className="flex items-center gap-1.5">
                            {timer.timer_type === 'countdown' ? (
                                <ArrowDown className="w-3.5 h-3.5" />
                            ) : (
                                <ArrowUp className="w-3.5 h-3.5" />
                            )}
                            <span>{timer.timer_type === 'countdown' ? 'Do' : 'Od'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(timer.target_date)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {timer.repeat_type !== 'none' && (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">
                                <Repeat className="w-3 h-3" />
                                {repeatLabels[timer.repeat_type]}
                            </span>
                        )}
                        {timer.is_public && (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                                <Share2 className="w-3 h-3" />
                                Publiczny
                            </span>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
