import { RegisterForm } from '@/components/auth/register-form';
import { MarketingSection } from '@/components/auth/marketing-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Rejestracja - TimerIQ',
    description: 'Utwórz konto w TimerIQ i zacznij zarządzać timerami',
};

export default function RegisterPage() {
    return (
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Marketing section - hidden on mobile */}
            <div className="hidden lg:block">
                <MarketingSection />
            </div>

            {/* Register form */}
            <div className="flex justify-center lg:justify-end">
                <RegisterForm />
            </div>
        </div>
    );
}
