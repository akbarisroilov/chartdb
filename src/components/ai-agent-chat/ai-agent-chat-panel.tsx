import React, { useEffect, useRef, useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/sheet/sheet';
import { useAIAgent } from '@/context/ai-agent-context/use-ai-agent';
import { AIAgentChatMessage } from './ai-agent-chat-message';
import { Button } from '@/components/button/button';
import { Textarea } from '@/components/textarea/textarea';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { Send, Trash2, X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/alert/alert';

export const AIAgentChatPanel: React.FC = () => {
    const { t } = useTranslation();
    const {
        messages,
        isProcessing,
        isOpen,
        error,
        sendMessage,
        clearMessages,
        clearError,
        closeChat,
        cancelRequest,
    } = useAIAgent();

    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || isProcessing) return;

        const message = inputValue;
        setInputValue('');
        await sendMessage(message);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeChat()}>
            <SheetContent
                side="right"
                className="flex w-full flex-col p-0 sm:max-w-md"
            >
                <SheetHeader className="border-b px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <SheetTitle className="text-lg">
                                {t('ai_agent.title')}
                            </SheetTitle>
                            <SheetDescription className="text-xs">
                                {t('ai_agent.description')}
                            </SheetDescription>
                        </div>
                        <div className="flex items-center gap-1">
                            {messages.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={clearMessages}
                                    title={t('ai_agent.clear_chat')}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={closeChat}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    </div>
                </SheetHeader>

                {/* Error alert */}
                {error && (
                    <Alert
                        variant="destructive"
                        className="mx-4 mt-2 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <AlertCircle className="size-4" />
                            <AlertDescription className="text-xs">
                                {error}
                            </AlertDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={clearError}
                        >
                            <X className="size-3" />
                        </Button>
                    </Alert>
                )}

                {/* Messages area */}
                <ScrollArea className="flex-1 px-4">
                    <div className="space-y-4 py-4">
                        {messages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <p className="text-sm">
                                    {t('ai_agent.empty_state')}
                                </p>
                                <p className="mt-2 text-xs">
                                    {t('ai_agent.empty_state_hint')}
                                </p>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <AIAgentChatMessage
                                    key={message.id}
                                    message={message}
                                />
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Input area */}
                <div className="border-t p-4">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('ai_agent.input_placeholder')}
                            className="min-h-[60px] resize-none"
                            disabled={isProcessing}
                        />
                        <div className="flex flex-col gap-2">
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!inputValue.trim() || isProcessing}
                                className="bg-pink-500 hover:bg-pink-600"
                            >
                                <Send className="size-4" />
                            </Button>
                            {isProcessing && (
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    onClick={cancelRequest}
                                    title={t('ai_agent.cancel')}
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
};
