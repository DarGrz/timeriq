import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TimeLeft } from '@/types/database';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function generateShareCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function calculateTimeLeft(targetDate: string, timerType: 'countdown' | 'countup'): TimeLeft {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();

    let difference: number;
    let isPast = false;

    if (timerType === 'countdown') {
        difference = target - now;
        isPast = difference < 0;
        if (isPast) difference = Math.abs(difference);
    } else {
        // countup - time since target
        difference = now - target;
        isPast = difference < 0;
        if (isPast) difference = Math.abs(difference);
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return {
        days,
        hours,
        minutes,
        seconds,
        total: difference,
        isPast,
    };
}

export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export function formatDateTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function getNextRepeatDate(currentDate: string, repeatType: string): string {
    const date = new Date(currentDate);

    switch (repeatType) {
        case 'daily':
            date.setDate(date.getDate() + 1);
            break;
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'yearly':
            date.setFullYear(date.getFullYear() + 1);
            break;
        default:
            return currentDate;
    }

    return date.toISOString();
}

export const timerColors = [
    { name: 'Czerwony', value: '#ef4444' },
    { name: 'Pomarańczowy', value: '#f97316' },
    { name: 'Żółty', value: '#eab308' },
    { name: 'Zielony', value: '#22c55e' },
    { name: 'Niebieski', value: '#3b82f6' },
    { name: 'Fioletowy', value: '#a855f7' },
    { name: 'Różowy', value: '#ec4899' },
    { name: 'Biały', value: '#ffffff' },
];

export const repeatOptions = [
    { label: 'Bez powtarzania', value: 'none' },
    { label: 'Codziennie', value: 'daily' },
    { label: 'Co tydzień', value: 'weekly' },
    { label: 'Co miesiąc', value: 'monthly' },
    { label: 'Co rok', value: 'yearly' },
];
