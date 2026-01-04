export type TimerType = 'countdown' | 'countup';

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Profile {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    created_at: string;
}

export interface Timer {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    target_date: string;
    timer_type: TimerType;
    repeat_type: RepeatType;
    color: string;
    is_public: boolean;
    share_code: string | null;
    created_at: string;
    updated_at: string;
}

export interface TimerShare {
    id: string;
    timer_id: string;
    shared_with_user_id: string;
    permission: 'view' | 'edit';
    created_at: string;
}

export interface TimerWithProfile extends Timer {
    profiles?: Profile;
}

export interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
    isPast: boolean;
}

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'created_at'>;
                Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
            };
            timers: {
                Row: Timer;
                Insert: Omit<Timer, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Timer, 'id' | 'user_id' | 'created_at'>>;
            };
            timer_shares: {
                Row: TimerShare;
                Insert: Omit<TimerShare, 'id' | 'created_at'>;
                Update: Partial<Omit<TimerShare, 'id' | 'created_at'>>;
            };
        };
    };
}
