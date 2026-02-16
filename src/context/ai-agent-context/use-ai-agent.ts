import { useContext } from 'react';
import { aiAgentContext } from './ai-agent-context';

export const useAIAgent = () => useContext(aiAgentContext);
