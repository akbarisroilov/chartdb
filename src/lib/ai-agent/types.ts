export type MessageRole = 'user' | 'assistant' | 'system';

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}

export interface ToolResult {
    toolCallId: string;
    toolName: string;
    success: boolean;
    result?: string;
    error?: string;
}

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
    createdAt: Date;
    isStreaming?: boolean;
}

export interface AIAgentState {
    messages: ChatMessage[];
    isProcessing: boolean;
    isOpen: boolean;
    error: string | null;
}

export interface AIAgentActions {
    sendMessage: (content: string) => Promise<void>;
    clearMessages: () => void;
    clearError: () => void;
    openChat: () => void;
    closeChat: () => void;
    toggleChat: () => void;
    cancelRequest: () => void;
}

export type AIAgentContextType = AIAgentState & AIAgentActions;

export interface FieldDefinition {
    name: string;
    type: string;
    primaryKey?: boolean;
    nullable?: boolean;
    unique?: boolean;
    default?: string;
}

export interface CreateTableParams {
    name: string;
    fields?: FieldDefinition[];
    schema?: string;
}

export interface AddFieldParams {
    tableName: string;
    fieldName: string;
    fieldType: string;
    primaryKey?: boolean;
    nullable?: boolean;
    unique?: boolean;
    default?: string;
}

export interface UpdateFieldParams {
    tableName: string;
    fieldName: string;
    newName?: string;
    newType?: string;
    nullable?: boolean;
    unique?: boolean;
    default?: string;
}

export interface DeleteFieldParams {
    tableName: string;
    fieldName: string;
}

export interface RenameTableParams {
    oldName: string;
    newName: string;
}

export interface DeleteTableParams {
    tableName: string;
}

export interface CreateRelationshipParams {
    sourceTable: string;
    sourceField: string;
    targetTable: string;
    targetField: string;
    type?: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
}

export interface DeleteRelationshipParams {
    sourceTable: string;
    sourceField: string;
    targetTable: string;
    targetField: string;
}

export interface GetSchemaInfoParams {
    tableName?: string;
}

export type ToolExecutorParams =
    | CreateTableParams
    | AddFieldParams
    | UpdateFieldParams
    | DeleteFieldParams
    | RenameTableParams
    | DeleteTableParams
    | CreateRelationshipParams
    | DeleteRelationshipParams
    | GetSchemaInfoParams;
