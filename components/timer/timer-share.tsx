'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Timer } from '@/types/database';
import { generateShareCode, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
    Share2,
    Link,
    Copy,
    Check,
    Globe,
    Lock,
    ExternalLink,
    QrCode
} from 'lucide-react';

interface TimerShareProps {
    timer: Timer;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: (timer: Timer) => void;
}

export function TimerShare({ timer, isOpen, onClose, onUpdate }: TimerShareProps) {
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [shareCode, setShareCode] = useState(timer.share_code);
    const [isPublic, setIsPublic] = useState(timer.is_public);

    const supabase = createClient();
    const shareUrl = shareCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareCode}` : '';

    const generateLink = async () => {
        setIsLoading(true);

        try {
            const newCode = generateShareCode();

            const { data, error } = await supabase
                .from('timers')
                .update({ share_code: newCode, is_public: true })
                .eq('id', timer.id)
                .select()
                .single();

            if (error) throw error;

            setShareCode(newCode);
            setIsPublic(true);
            onUpdate?.(data);
        } catch (error) {
            console.error('Error generating share link:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePublic = async () => {
        setIsLoading(true);

        try {
            const { data, error } = await supabase
                .from('timers')
                .update({ is_public: !isPublic })
                .eq('id', timer.id)
                .select()
                .single();

            if (error) throw error;

            setIsPublic(!isPublic);
            onUpdate?.(data);
        } catch (error) {
            console.error('Error toggling public status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Udostępnij timer"
            description="Podziel się swoim timerem ze znajomymi"
            size="md"
        >
            <div className="space-y-6">
                {/* Timer Preview */}
                <div
                    className="p-4 rounded-xl border-2 relative overflow-hidden"
                    style={{ borderColor: timer.color + '40' }}
                >
                    <div
                        className="absolute inset-0 opacity-5"
                        style={{ backgroundColor: timer.color }}
                    />
                    <div className="relative">
                        <h3 className="font-semibold text-lg">{timer.title}</h3>
                        {timer.description && (
                            <p className="text-sm text-foreground-muted mt-1">{timer.description}</p>
                        )}
                    </div>
                </div>

                {/* Privacy Toggle */}
                <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                        {isPublic ? (
                            <div className="p-2 rounded-lg bg-success/10">
                                <Globe className="w-5 h-5 text-success" />
                            </div>
                        ) : (
                            <div className="p-2 rounded-lg bg-foreground-muted/10">
                                <Lock className="w-5 h-5 text-foreground-muted" />
                            </div>
                        )}
                        <div>
                            <p className="font-medium">{isPublic ? 'Publiczny' : 'Prywatny'}</p>
                            <p className="text-sm text-foreground-muted">
                                {isPublic
                                    ? 'Każdy z linkiem ma dostęp'
                                    : 'Tylko Ty masz dostęp'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={togglePublic}
                        disabled={isLoading}
                        className={cn(
                            'relative w-12 h-6 rounded-full transition-colors duration-200',
                            isPublic ? 'bg-success' : 'bg-border'
                        )}
                    >
                        <motion.div
                            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                            animate={{ left: isPublic ? '28px' : '4px' }}
                            transition={{ duration: 0.2 }}
                        />
                    </button>
                </div>

                {/* Share Link Section */}
                {shareCode ? (
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-foreground">
                            Link do udostępnienia
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={shareUrl}
                                readOnly
                                leftIcon={<Link className="w-4 h-4" />}
                                className="flex-1"
                            />
                            <Button
                                variant={copied ? 'primary' : 'secondary'}
                                onClick={copyToClipboard}
                                leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            >
                                {copied ? 'Skopiowano!' : 'Kopiuj'}
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(shareUrl, '_blank')}
                                leftIcon={<ExternalLink className="w-4 h-4" />}
                            >
                                Otwórz w nowej karcie
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                            <Share2 className="w-8 h-8 text-accent" />
                        </div>
                        <h3 className="font-semibold mb-2">Wygeneruj link</h3>
                        <p className="text-sm text-foreground-muted mb-4">
                            Utwórz unikalny link, który możesz udostępnić znajomym
                        </p>
                        <Button
                            variant="primary"
                            onClick={generateLink}
                            isLoading={isLoading}
                            leftIcon={<Link className="w-4 h-4" />}
                        >
                            Generuj link
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
