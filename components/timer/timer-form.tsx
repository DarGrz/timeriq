'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Timer, TimerType, RepeatType } from '@/types/database';
import { timerColors, repeatOptions, cn } from '@/lib/utils';
import {
    ArrowDown,
    ArrowUp,
    Calendar,
    Type,
    FileText,
    Palette,
    Repeat,
    Globe,
    Lock,
    Save,
    X
} from 'lucide-react';

interface TimerFormProps {
    initialData?: Partial<Timer>;
    onSubmit: (data: Omit<Timer, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'share_code'>) => Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
}

export function TimerForm({ initialData, onSubmit, onCancel, isLoading }: TimerFormProps) {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        target_date: initialData?.target_date
            ? new Date(initialData.target_date).toISOString().slice(0, 16)
            : '',
        timer_type: (initialData?.timer_type || 'countdown') as TimerType,
        repeat_type: (initialData?.repeat_type || 'none') as RepeatType,
        color: initialData?.color || '#ef4444',
        is_public: initialData?.is_public || false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Tytuł jest wymagany';
        }

        if (!formData.target_date) {
            newErrors.target_date = 'Data jest wymagana';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        // Keep the local timezone by creating a proper ISO string with timezone offset
        const localDate = new Date(formData.target_date);
        const isoString = localDate.toISOString();

        await onSubmit({
            ...formData,
            target_date: isoString,
        });
    };

    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            {/* Timer Type Selection */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                    Typ timera
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, timer_type: 'countdown' })}
                        className={cn(
                            'flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200',
                            formData.timer_type === 'countdown'
                                ? 'border-accent bg-accent/10'
                                : 'border-border hover:border-border-hover bg-card'
                        )}
                    >
                        <ArrowDown className={cn(
                            'w-5 h-5',
                            formData.timer_type === 'countdown' ? 'text-accent' : 'text-foreground-muted'
                        )} />
                        <div className="text-left">
                            <p className="font-medium">Odliczanie do</p>
                            <p className="text-xs text-foreground-muted">Ile zostało do wydarzenia</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, timer_type: 'countup' })}
                        className={cn(
                            'flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200',
                            formData.timer_type === 'countup'
                                ? 'border-accent bg-accent/10'
                                : 'border-border hover:border-border-hover bg-card'
                        )}
                    >
                        <ArrowUp className={cn(
                            'w-5 h-5',
                            formData.timer_type === 'countup' ? 'text-accent' : 'text-foreground-muted'
                        )} />
                        <div className="text-left">
                            <p className="font-medium">Czas od</p>
                            <p className="text-xs text-foreground-muted">Ile minęło od wydarzenia</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Title */}
            <Input
                label="Tytuł"
                placeholder="np. Urodziny, Wakacje, Nowy Rok..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={errors.title}
                leftIcon={<Type className="w-4 h-4" />}
            />

            {/* Description */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                    Opis (opcjonalnie)
                </label>
                <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-foreground-muted" />
                    <textarea
                        placeholder="Dodaj opis wydarzenia..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className={cn(
                            'w-full px-4 py-2.5 pl-10 rounded-lg resize-none',
                            'bg-card border border-border',
                            'text-foreground placeholder:text-foreground-muted',
                            'transition-all duration-200',
                            'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
                            'hover:border-border-hover'
                        )}
                    />
                </div>
            </div>

            {/* Target Date */}
            <Input
                type="datetime-local"
                label={formData.timer_type === 'countdown' ? 'Data docelowa' : 'Data początkowa'}
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                error={errors.target_date}
                leftIcon={<Calendar className="w-4 h-4" />}
            />

            {/* Color Selection */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Palette className="w-4 h-4 text-foreground-muted" />
                    Kolor akcentu
                </label>
                <div className="flex flex-wrap gap-3">
                    {timerColors.map((colorOption) => (
                        <button
                            key={colorOption.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, color: colorOption.value })}
                            className={cn(
                                'w-10 h-10 rounded-full transition-all duration-200',
                                'ring-offset-background ring-offset-2',
                                formData.color === colorOption.value
                                    ? 'ring-2 ring-foreground scale-110'
                                    : 'hover:scale-105'
                            )}
                            style={{ backgroundColor: colorOption.value }}
                            title={colorOption.name}
                        />
                    ))}
                </div>
            </div>

            {/* Repeat Type */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Repeat className="w-4 h-4 text-foreground-muted" />
                    Powtarzanie
                </label>
                <div className="flex flex-wrap gap-2">
                    {repeatOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, repeat_type: option.value as RepeatType })}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                                formData.repeat_type === option.value
                                    ? 'bg-accent text-white'
                                    : 'bg-card border border-border hover:border-border-hover text-foreground'
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Privacy Toggle */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                    Widoczność
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_public: false })}
                        className={cn(
                            'flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                            !formData.is_public
                                ? 'border-accent bg-accent/10'
                                : 'border-border hover:border-border-hover bg-card'
                        )}
                    >
                        <Lock className={cn(
                            'w-4 h-4',
                            !formData.is_public ? 'text-accent' : 'text-foreground-muted'
                        )} />
                        <span className="font-medium">Prywatny</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_public: true })}
                        className={cn(
                            'flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                            formData.is_public
                                ? 'border-accent bg-accent/10'
                                : 'border-border hover:border-border-hover bg-card'
                        )}
                    >
                        <Globe className={cn(
                            'w-4 h-4',
                            formData.is_public ? 'text-accent' : 'text-foreground-muted'
                        )} />
                        <span className="font-medium">Publiczny</span>
                    </button>
                </div>
                <p className="text-xs text-foreground-muted">
                    {formData.is_public
                        ? 'Każdy z linkiem może zobaczyć ten timer'
                        : 'Tylko Ty możesz zobaczyć ten timer'}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
                {onCancel && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        leftIcon={<X className="w-4 h-4" />}
                    >
                        Anuluj
                    </Button>
                )}
                <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    leftIcon={<Save className="w-4 h-4" />}
                    className="flex-1"
                >
                    {initialData?.id ? 'Zapisz zmiany' : 'Utwórz timer'}
                </Button>
            </div>
        </motion.form>
    );
}
