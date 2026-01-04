'use client';

import { motion } from 'framer-motion';
import { Timer, Users, Zap, Trophy } from 'lucide-react';

const features = [
    {
        icon: Timer,
        title: 'Inteligentne timery',
        description: 'Twórz odliczania, które działają dokładnie tak, jak potrzebujesz',
    },
    {
        icon: Users,
        title: 'Dziel się z innymi',
        description: 'Udostępniaj swoje timery znajomym i rodzinie jednym klikiem',
    },
    {
        icon: Zap,
        title: 'Błyskawicznie szybkie',
        description: 'Bez opóźnień, bez ładowania - natychmiastowe działanie',
    },
];

export function MarketingSection() {
    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-8"
        >
            {/* Main headline */}
            <div className="space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20"
                >
                    <Trophy className="w-4 h-4 text-accent" />
                    <span className="text-sm text-accent font-medium">Dołącz do tysięcy użytkowników</span>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="text-4xl lg:text-5xl font-bold leading-tight"
                >
                    Zarządzaj czasem
                    <span className="block text-accent">jak profesjonalista</span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="text-lg text-foreground-muted max-w-md"
                >
                    TimerIQ to nie zwykły timer. To Twój osobisty asystent, który pomoże Ci
                    osiągać cele i nigdy nie przegapić ważnych momentów.
                </motion.p>
            </div>

            {/* Features list */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="space-y-4"
            >
                {features.map((feature, index) => (
                    <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                        className="flex items-start gap-4 p-4 rounded-xl bg-surface/50 border border-border/50 backdrop-blur-sm hover:bg-surface/80 transition-colors"
                    >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                            <feature.icon className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">{feature.title}</h3>
                            <p className="text-sm text-foreground-muted">{feature.description}</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Social proof */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.9 }}
                className="pt-4 border-t border-border/50"
            >
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/60 to-accent border-2 border-background"
                                style={{ zIndex: 5 - i }}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-foreground-muted">
                        <span className="font-semibold text-foreground">2,500+</span> użytkowników korzysta z TimerIQ
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
