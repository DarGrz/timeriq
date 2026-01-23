export type ExerciseType =
    | 'desk_pushups'      // Pompki o biurko
    | 'pushups'           // Pompki na ziemi
    | 'squats'            // Przysiady
    | 'lunges'            // Wykroki
    | 'burpees'           // Padnij-powstań (burpees)
    | 'crunches'          // Brzuszki
    | 'toe_touches'       // Dotykanie palców u stóp (siedząc)
    | 'chair_twists'      // Skręty na krześle
    | 'eye_rest'          // Odpoczynek dla oczu (20-20-20)
    | 'calf_raises'       // Wspięcia na palce
    | 'desk_stretch'      // Rozciąganie przy biurku
    | 'neck_rolls'        // Krążenia głową
    | 'wrist_stretch'     // Rozciąganie nadgarstków
    | 'standing_stretch'; // Rozciąganie w pozycji stojącej

export interface Exercise {
    type: ExerciseType;
    name: string;
    description: string;
    duration: number; // w sekundach
    reps?: number;    // liczba powtórzeń (opcjonalne)
    icon: string;     // emoji lub ikona
}

export interface WorkoutSchedule {
    id: string;
    user_id: string;
    title: string;
    duration: number;              // długość treningu w minutach
    frequency: number;             // co ile godzin (np. co 1 godzinę)
    daily_repetitions: number;     // ile razy dziennie
    exercises: ExerciseType[];     // wybrane ćwiczenia
    is_active: boolean;
    start_time?: string;           // opcjonalny czas rozpoczęcia (np. "09:00")
    end_time?: string;             // opcjonalny czas zakończenia (np. "17:00")
    work_days_only: boolean;       // tylko dni robocze (pon-pt)
    created_at: string;
    updated_at: string;
}

export interface ExerciseResult {
    type: ExerciseType;
    reps?: number;
}

export interface WorkoutSession {
    id: string;
    schedule_id: string;
    user_id: string;
    scheduled_time: string;
    completed_at: string | null;
    exercises_completed: ExerciseResult[];
    skipped: boolean;
    created_at: string;
}

export const AVAILABLE_EXERCISES: Exercise[] = [
    {
        type: 'desk_pushups',
        name: 'Pompki o biurko',
        description: 'Oprzyj dłonie o krawędź biurka i wykonuj pompki. Bezpieczniejsze dla ubrań!',
        duration: 45,
        reps: 12,
        icon: '🪑'
    },
    {
        type: 'pushups',
        name: 'Pompki na ziemi',
        description: 'Klasyczne pompki na podłodze. Najlepsze ćwiczenie na klatkę i triceps.',
        duration: 60,
        reps: 15,
        icon: '💪'
    },
    {
        type: 'squats',
        name: 'Przysiady',
        description: 'Wstań od biurka i wykonaj serię głębokich przysiadów. Pobudź krążenie w nogach.',
        duration: 60,
        reps: 15,
        icon: '🦵'
    },
    {
        type: 'lunges',
        name: 'Wykroki',
        description: 'Zrób duży krok do przodu i obniż biodra. Świetne na stabilizację i nogi.',
        duration: 60,
        reps: 10,
        icon: '🏃'
    },
    {
        type: 'burpees',
        name: 'Burpees',
        description: 'Padnij, zrób pompkę, wstań i wyskocz. Kompletne spalanie energii!',
        duration: 60,
        reps: 8,
        icon: '🔥'
    },
    {
        type: 'crunches',
        name: 'Brzuszki',
        description: 'Połóż się na plecach, ugnij nogi w kolanach i unieś barki, mocno spinając mięśnie brzucha. Pamiętaj o wydechu przy spięciu.',
        duration: 45,
        reps: 20,
        icon: '🤸'
    },
    {
        type: 'toe_touches',
        name: 'Dotykanie stóp',
        description: 'W siadzie rozkrocznym dotykaj naprzemiennie palców u stóp. Rozciągnij dół pleców.',
        duration: 45,
        icon: '👣'
    },
    {
        type: 'chair_twists',
        name: 'Skręty na krześle',
        description: 'Usiądź prosto, złap za oparcie krzesła i wykonaj skręt tułowia. Rozluźnij kręgosłup.',
        duration: 45,
        icon: '🔄'
    },
    {
        type: 'eye_rest',
        name: 'Odpoczynek dla oczu',
        description: 'Zasada 20-20-20: patrz na obiekt oddalony o 6 metrów przez 20 sekund.',
        duration: 20,
        icon: '👀'
    },
    {
        type: 'calf_raises',
        name: 'Wspięcia na palce',
        description: 'Stań prosto i wspięgnij się na palce. Idealne na "ciężkie nogi".',
        duration: 45,
        reps: 20,
        icon: '⬆️'
    },
    {
        type: 'desk_stretch',
        name: 'Rozciąganie przy biurku',
        description: 'Wyciągnij ręce mocno przed siebie, a potem nad głowę. Rozciągnij kręgosłup.',
        duration: 30,
        icon: '🧘'
    },
    {
        type: 'neck_rolls',
        name: 'Krążenia głową',
        description: 'Łagodne krążenia głową - odprężenie karku spiętego od monitora.',
        duration: 30,
        icon: '🌀'
    },
    {
        type: 'wrist_stretch',
        name: 'Rozciąganie nadgarstków',
        description: 'Odciągnij dłonią palce drugiej ręki do tyłu. Kluczowe przy pracy z myszką.',
        duration: 30,
        icon: '✋'
    },
    {
        type: 'standing_stretch',
        name: 'Rozciąganie w pozycji stojącej',
        description: 'Pełne rozciąganie całego ciała w pozycji stojącej',
        duration: 60,
        icon: '🙆'
    }
];

export interface Database {
    public: {
        Tables: {
            workout_schedules: {
                Row: WorkoutSchedule;
                Insert: Omit<WorkoutSchedule, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<WorkoutSchedule, 'id' | 'user_id' | 'created_at'>>;
            };
            workout_sessions: {
                Row: WorkoutSession;
                Insert: Omit<WorkoutSession, 'id' | 'created_at'>;
                Update: Partial<Omit<WorkoutSession, 'id' | 'user_id' | 'created_at'>>;
            };
        };
    };
}
