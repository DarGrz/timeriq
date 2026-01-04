import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { PublicTimerView } from './public-timer-view';

interface PageProps {
    params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { code } = await params;
    const supabase = await createClient();

    const { data: timer } = await supabase
        .from('timers')
        .select('title, description')
        .eq('share_code', code)
        .eq('is_public', true)
        .single();

    if (!timer) {
        return {
            title: 'Timer nie znaleziony - TimerIQ',
        };
    }

    return {
        title: `${timer.title} - TimerIQ`,
        description: timer.description || `Odliczanie do: ${timer.title}`,
        openGraph: {
            title: timer.title,
            description: timer.description || `Odliczanie do: ${timer.title}`,
        },
    };
}

export default async function SharePage({ params }: PageProps) {
    const { code } = await params;
    const supabase = await createClient();

    const { data: timer, error } = await supabase
        .from('timers')
        .select('*')
        .eq('share_code', code)
        .eq('is_public', true)
        .single();

    if (error || !timer) {
        notFound();
    }

    return <PublicTimerView timer={timer} />;
}
