import React, { useCallback, useRef, useState } from 'react';
import { aiAgentContext } from './ai-agent-context';
import type { ChatMessage, ToolCall, ToolResult } from '@/lib/ai-agent/types';
import { sendAIMessage } from '@/lib/ai-agent/ai-agent-service';
import { useChartDB } from '@/hooks/use-chartdb';
import { generateId } from '@/lib/utils';

export const AIAgentProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const chartDB = useChartDB();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || isProcessing) {
                return;
            }

            setError(null);

            // Add user message
            const userMessage: ChatMessage = {
                id: generateId(),
                role: 'user',
                content: content.trim(),
                createdAt: new Date(),
            };

            setMessages((prev) => [...prev, userMessage]);

            // Create assistant message placeholder for streaming
            const assistantMessageId = generateId();
            const assistantMessage: ChatMessage = {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                toolCalls: [],
                toolResults: [],
                createdAt: new Date(),
                isStreaming: true,
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setIsProcessing(true);

            // Create abort controller for this request
            abortControllerRef.current = new AbortController();

            try {
                await sendAIMessage({
                    messages: [...messages, userMessage],
                    chartDB,
                    signal: abortControllerRef.current.signal,
                    onTextChunk: (chunk) => {
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === assistantMessageId
                                    ? { ...msg, content: msg.content + chunk }
                                    : msg
                            )
                        );
                    },
                    onToolCall: (toolCall: ToolCall) => {
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === assistantMessageId
                                    ? {
                                          ...msg,
                                          toolCalls: [
                                              ...(msg.toolCalls ?? []),
                                              toolCall,
                                          ],
                                      }
                                    : msg
                            )
                        );
                    },
                    onToolResult: (result: ToolResult) => {
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === assistantMessageId
                                    ? {
                                          ...msg,
                                          toolResults: [
                                              ...(msg.toolResults ?? []),
                                              result,
                                          ],
                                      }
                                    : msg
                            )
                        );
                    },
                    onComplete: () => {
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === assistantMessageId
                                    ? { ...msg, isStreaming: false }
                                    : msg
                            )
                        );
                        setIsProcessing(false);
                    },
                    onError: (err) => {
                        setError(err.message);
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === assistantMessageId
                                    ? {
                                          ...msg,
                                          content:
                                              msg.content ||
                                              'Sorry, an error occurred while processing your request.',
                                          isStreaming: false,
                                      }
                                    : msg
                            )
                        );
                        setIsProcessing(false);
                    },
                });
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unknown error occurred'
                );
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMessageId
                            ? {
                                  ...msg,
                                  content:
                                      msg.content ||
                                      'Sorry, an error occurred while processing your request.',
                                  isStreaming: false,
                              }
                            : msg
                    )
                );
                setIsProcessing(false);
            }
        },
        [messages, isProcessing, chartDB]
    );

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const openChat = useCallback(() => {
        setIsOpen(true);
    }, []);

    const closeChat = useCallback(() => {
        setIsOpen(false);
    }, []);

    const toggleChat = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const cancelRequest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsProcessing(false);
    }, []);

    return (
        <aiAgentContext.Provider
            value={{
                messages,
                isProcessing,
                isOpen,
                error,
                sendMessage,
                clearMessages,
                clearError,
                openChat,
                closeChat,
                toggleChat,
                cancelRequest,
            }}
        >
            {children}
        </aiAgentContext.Provider>
    );
};
