import React from 'react';
import type { ChatMessage } from '@/lib/ai-agent/types';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Loader2, Wrench } from 'lucide-react';

export interface AIAgentChatMessageProps {
    message: ChatMessage;
}

export const AIAgentChatMessage: React.FC<AIAgentChatMessageProps> = ({
    message,
}) => {
    const isUser = message.role === 'user';
    const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;
    const hasToolResults =
        message.toolResults && message.toolResults.length > 0;

    return (
        <div
            className={cn(
                'flex w-full',
                isUser ? 'justify-end' : 'justify-start'
            )}
        >
            <div
                className={cn(
                    'max-w-[85%] rounded-lg px-4 py-2',
                    isUser
                        ? 'bg-pink-500 text-white'
                        : 'bg-secondary text-foreground'
                )}
            >
                {/* Message content */}
                {message.content && (
                    <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                    </div>
                )}

                {/* Streaming indicator */}
                {message.isStreaming && !message.content && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        <span>Thinking...</span>
                    </div>
                )}

                {/* Tool calls display */}
                {hasToolCalls && (
                    <div className="mt-2 space-y-1">
                        {message.toolCalls!.map((toolCall, index) => {
                            const result = message.toolResults?.find(
                                (r) => r.toolCallId === toolCall.id
                            );
                            const isPending = !result;
                            const isSuccess = result?.success;

                            return (
                                <div
                                    key={toolCall.id || index}
                                    className="flex items-center gap-2 text-xs"
                                >
                                    {isPending ? (
                                        <Loader2 className="size-3 animate-spin text-muted-foreground" />
                                    ) : isSuccess ? (
                                        <CheckCircle className="size-3 text-green-500" />
                                    ) : (
                                        <XCircle className="size-3 text-red-500" />
                                    )}
                                    <Wrench className="size-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        {formatToolName(toolCall.name)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Tool results with errors */}
                {hasToolResults && (
                    <div className="mt-2 space-y-1">
                        {message
                            .toolResults!.filter((r) => !r.success && r.error)
                            .map((result, index) => (
                                <div
                                    key={result.toolCallId || index}
                                    className="text-xs text-red-400"
                                >
                                    {result.error}
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const formatToolName = (name: string): string => {
    return name
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
