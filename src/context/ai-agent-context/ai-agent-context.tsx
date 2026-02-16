import { createContext } from 'react';
import type { AIAgentContextType } from '@/lib/ai-agent/types';
import { emptyFn } from '@/lib/utils';

export const aiAgentContext = createContext<AIAgentContextType>({
    messages: [],
    isProcessing: false,
    isOpen: false,
    error: null,
    sendMessage: emptyFn,
    clearMessages: emptyFn,
    clearError: emptyFn,
    openChat: emptyFn,
    closeChat: emptyFn,
    toggleChat: emptyFn,
    cancelRequest: emptyFn,
});
