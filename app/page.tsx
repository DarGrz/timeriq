'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { TimerDisplay } from '@/components/timer/timer-display';
import {
  Timer,
  Share2,
  Repeat,
  Zap,
  Shield,
  Smartphone,
  ArrowRight,
  Check
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Timer,
    title: 'Odliczanie i zliczanie',
    description: 'Odliczaj do ważnych wydarzeń lub śledź ile czasu minęło od danego momentu.',
  },
  {
    icon: Share2,
    title: 'Udostępnianie',
    description: 'Generuj unikalne linki i dziel się timerami ze znajomymi jednym kliknięciem.',
  },
  {
    icon: Repeat,
    title: 'Powtarzalne timery',
    description: 'Ustaw timery, które automatycznie się powtarzają - codziennie, tygodniowo lub rocznie.',
  },
  {
    icon: Zap,
    title: 'Błyskawiczne',
    description: 'Tworzenie nowego timera zajmuje dosłownie kilka sekund. Zero zbędnych kroków.',
  },
  {
    icon: Shield,
    title: 'Prywatność',
    description: 'Ty decydujesz, które timery są publiczne, a które tylko dla Ciebie.',
  },
  {
    icon: Smartphone,
    title: 'Wszędzie i zawsze',
    description: 'Aplikacja działa perfekcyjnie na każdym urządzeniu - telefonie, tablecie i komputerze.',
  },
];

// Demo timer - Nowy Rok 2027
const demoTargetDate = '2027-01-01T00:00:00';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8"
            >
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">100% darmowe</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Odmierzaj czas
              <br />
              <span className="gradient-text">jak nigdy dotąd</span>
            </h1>

            <p className="text-xl text-foreground-muted max-w-2xl mx-auto mb-8">
              Twórz piękne timery, udostępniaj je znajomym i nigdy nie przegap ważnego momentu.
              Prostota i elegancja w jednym.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/register">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="text-lg px-8"
                >
                  Rozpocznij za darmo
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-lg px-8">
                  Zaloguj się
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Demo Timer */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="p-8 rounded-3xl bg-card/50 border border-border backdrop-blur-sm">
              <p className="text-sm text-foreground-muted mb-4">Do Nowego Roku 2027</p>
              <TimerDisplay
                targetDate={demoTargetDate}
                timerType="countdown"
                color="#ef4444"
                size="lg"
              />
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-foreground-muted flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-foreground-muted rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Wszystko czego potrzebujesz
            </h2>
            <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
              TimerIQ oferuje intuicyjne narzędzia do zarządzania czasem
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-foreground-muted">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Tak proste, że aż niewiarygodne
            </h2>
            <p className="text-xl text-foreground-muted">
              Trzy kroki do Twojego pierwszego timera
            </p>
          </motion.div>

          <div className="space-y-8">
            {[
              { step: 1, title: 'Utwórz konto', desc: 'Zarejestruj się za darmo w kilka sekund' },
              { step: 2, title: 'Dodaj timer', desc: 'Wybierz typ, datę i personalizuj wygląd' },
              { step: 3, title: 'Udostępnij', desc: 'Podziel się linkiem ze znajomymi' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="flex items-center gap-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-2xl font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
                  <p className="text-foreground-muted">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="p-12 rounded-3xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full blur-[100px]" />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">
                Gotowy na start?
              </h2>
              <p className="text-xl text-foreground-muted mb-8 max-w-xl mx-auto">
                Dołącz do TimerIQ i zacznij odmierzać czas do najważniejszych momentów w życiu.
              </p>
              <Link href="/register">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="text-lg px-8"
                >
                  Utwórz konto za darmo
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-foreground-muted">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" /> Bez karty kredytowej
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" /> 100% darmowe
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-accent" />
            <span className="font-bold">Timer<span className="text-accent">IQ</span></span>
          </div>
          <p className="text-sm text-foreground-muted">
            © 2026 TimerIQ. Wszystkie prawa zastrzeżone.
          </p>
        </div>
      </footer>
    </div>
  );
}
