import { LoginForm } from '@/components/auth/login-form';
import { MarketingSection } from '@/components/auth/marketing-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Logowanie - TimerIQ',
    description: 'Zaloguj się do TimerIQ i zarządzaj swoimi timerami',
};

export default function LoginPage() {
    return (
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Marketing section - hidden on mobile */}
            <div className="hidden lg:block">
                <MarketingSection />
            </div>

            {/* Login form */}
            <div className="flex justify-center lg:justify-end">
                <LoginForm />
            </div>
        </div>
    );
}
