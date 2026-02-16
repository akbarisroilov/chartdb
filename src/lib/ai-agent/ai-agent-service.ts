import type { ChartDBContext } from '@/context/chartdb-context/chartdb-context';
import type { ChatMessage, ToolCall, ToolResult } from './types';
import { generateSystemPrompt } from './schema-serializer';
import type { ToolName } from './tools/tool-definitions';
import {
    executeCreateTable,
    executeRenameTable,
    executeDeleteTable,
} from './tools/table-tools';
import {
    executeAddField,
    executeUpdateField,
    executeDeleteField,
} from './tools/field-tools';
import {
    executeCreateRelationship,
    executeDeleteRelationship,
    executeGetSchemaInfo,
} from './tools/relationship-tools';
import { OPENAI_API_KEY, OPENAI_API_ENDPOINT, LLM_MODEL_NAME } from '@/lib/env';

interface SendMessageOptions {
    messages: ChatMessage[];
    onTextChunk: (chunk: string) => void;
    onToolCall: (toolCall: ToolCall) => void;
    onToolResult: (result: ToolResult) => void;
    onComplete: (fullText: string) => void;
    onError: (error: Error) => void;
    signal?: AbortSignal;
    chartDB: ChartDBContext;
}

const validateConfiguration = (): {
    apiKey: string;
    baseUrl: string;
    modelName: string;
} => {
    const apiKey = window?.env?.OPENAI_API_KEY ?? OPENAI_API_KEY;
    const baseUrl =
        window?.env?.OPENAI_API_ENDPOINT ??
        OPENAI_API_ENDPOINT ??
        'https://api.openai.com/v1';
    const modelName =
        window?.env?.LLM_MODEL_NAME ?? LLM_MODEL_NAME ?? 'gpt-4o-mini';

    if (!apiKey) {
        throw new Error(
            'AI Assistant requires an API key. Please configure VITE_OPENAI_API_KEY in your environment.'
        );
    }

    return { apiKey, baseUrl, modelName };
};

const executeToolCall = async (
    toolName: ToolName,
    args: unknown,
    chartDB: ChartDBContext
): Promise<ToolResult> => {
    switch (toolName) {
        case 'create_table':
            return executeCreateTable(
                args as unknown as Parameters<typeof executeCreateTable>[0],
                chartDB
            );
        case 'add_field':
            return executeAddField(
                args as unknown as Parameters<typeof executeAddField>[0],
                chartDB
            );
        case 'update_field':
            return executeUpdateField(
                args as unknown as Parameters<typeof executeUpdateField>[0],
                chartDB
            );
        case 'delete_field':
            return executeDeleteField(
                args as unknown as Parameters<typeof executeDeleteField>[0],
                chartDB
            );
        case 'rename_table':
            return executeRenameTable(
                args as unknown as Parameters<typeof executeRenameTable>[0],
                chartDB
            );
        case 'delete_table':
            return executeDeleteTable(
                args as unknown as Parameters<typeof executeDeleteTable>[0],
                chartDB
            );
        case 'create_relationship':
            return executeCreateRelationship(
                args as unknown as Parameters<
                    typeof executeCreateRelationship
                >[0],
                chartDB
            );
        case 'delete_relationship':
            return executeDeleteRelationship(
                args as unknown as Parameters<
                    typeof executeDeleteRelationship
                >[0],
                chartDB
            );
        case 'get_schema_info':
            return executeGetSchemaInfo(
                args as unknown as Parameters<typeof executeGetSchemaInfo>[0],
                chartDB
            );
        default:
            return {
                toolCallId: '',
                toolName: toolName,
                success: false,
                error: `Unknown tool: ${toolName}`,
            };
    }
};

// Tool definitions for the API
const getToolDefinitions = () => [
    {
        type: 'function',
        function: {
            name: 'create_table',
            description:
                'Create a new database table with optional fields. Use this when the user wants to create a new table.',
            parameters: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'The name of the table to create',
                    },
                    fields: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                type: { type: 'string' },
                                primaryKey: { type: 'boolean' },
                                nullable: { type: 'boolean' },
                                unique: { type: 'boolean' },
                                default: { type: 'string' },
                            },
                            required: ['name', 'type'],
                        },
                        description: 'Array of fields to create with the table',
                    },
                    schema: {
                        type: 'string',
                        description: 'The schema to create the table in',
                    },
                },
                required: ['name'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'add_field',
            description: 'Add a new field (column) to an existing table.',
            parameters: {
                type: 'object',
                properties: {
                    tableName: { type: 'string' },
                    fieldName: { type: 'string' },
                    fieldType: { type: 'string' },
                    primaryKey: { type: 'boolean' },
                    nullable: { type: 'boolean' },
                    unique: { type: 'boolean' },
                    default: { type: 'string' },
                },
                required: ['tableName', 'fieldName', 'fieldType'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'update_field',
            description: 'Update an existing field in a table.',
            parameters: {
                type: 'object',
                properties: {
                    tableName: { type: 'string' },
                    fieldName: { type: 'string' },
                    newName: { type: 'string' },
                    newType: { type: 'string' },
                    nullable: { type: 'boolean' },
                    unique: { type: 'boolean' },
                    default: { type: 'string' },
                },
                required: ['tableName', 'fieldName'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'delete_field',
            description: 'Delete a field (column) from a table.',
            parameters: {
                type: 'object',
                properties: {
                    tableName: { type: 'string' },
                    fieldName: { type: 'string' },
                },
                required: ['tableName', 'fieldName'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'rename_table',
            description: 'Rename an existing table.',
            parameters: {
                type: 'object',
                properties: {
                    oldName: { type: 'string' },
                    newName: { type: 'string' },
                },
                required: ['oldName', 'newName'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'delete_table',
            description: 'Delete a table from the schema.',
            parameters: {
                type: 'object',
                properties: {
                    tableName: { type: 'string' },
                },
                required: ['tableName'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_relationship',
            description:
                'Create a relationship (foreign key) between two tables.',
            parameters: {
                type: 'object',
                properties: {
                    sourceTable: { type: 'string' },
                    sourceField: { type: 'string' },
                    targetTable: { type: 'string' },
                    targetField: { type: 'string' },
                    type: {
                        type: 'string',
                        enum: [
                            'one_to_one',
                            'one_to_many',
                            'many_to_one',
                            'many_to_many',
                        ],
                    },
                },
                required: [
                    'sourceTable',
                    'sourceField',
                    'targetTable',
                    'targetField',
                ],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'delete_relationship',
            description: 'Delete a relationship between two tables.',
            parameters: {
                type: 'object',
                properties: {
                    sourceTable: { type: 'string' },
                    sourceField: { type: 'string' },
                    targetTable: { type: 'string' },
                    targetField: { type: 'string' },
                },
                required: [
                    'sourceTable',
                    'sourceField',
                    'targetTable',
                    'targetField',
                ],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_schema_info',
            description:
                'Get information about the current database schema. Use this to understand what tables and fields exist.',
            parameters: {
                type: 'object',
                properties: {
                    tableName: {
                        type: 'string',
                        description:
                            'Optional: Get info about a specific table.',
                    },
                },
            },
        },
    },
];

interface APIMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | null;
    tool_calls?: Array<{
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
    }>;
    tool_call_id?: string;
}

export const sendAIMessage = async (
    options: SendMessageOptions
): Promise<void> => {
    const {
        messages,
        onTextChunk,
        onToolCall,
        onToolResult,
        onComplete,
        onError,
        signal,
        chartDB,
    } = options;

    try {
        const { apiKey, baseUrl, modelName } = validateConfiguration();
        console.log('[AI Agent] Starting request with model:', modelName);

        const systemPrompt = generateSystemPrompt(chartDB.currentDiagram);

        // Build messages array
        const apiMessages: APIMessage[] = [
            { role: 'system', content: systemPrompt },
            ...messages.map((msg) => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            })),
        ];

        let fullText = '';
        let continueLoop = true;
        let iterations = 0;
        const maxIterations = 5;

        while (continueLoop && iterations < maxIterations) {
            iterations++;
            console.log('[AI Agent] Iteration:', iterations);

            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: apiMessages,
                    tools: getToolDefinitions(),
                    tool_choice: 'auto',
                    stream: true,
                }),
                signal,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let assistantContent = '';
            const toolCalls: Array<{
                id: string;
                type: 'function';
                function: { name: string; arguments: string };
            }> = [];

            // Read the stream
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices?.[0]?.delta;

                            if (delta?.content) {
                                assistantContent += delta.content;
                                fullText += delta.content;
                                onTextChunk(delta.content);
                            }

                            // Handle tool calls
                            if (delta?.tool_calls) {
                                for (const tc of delta.tool_calls) {
                                    if (tc.index !== undefined) {
                                        if (!toolCalls[tc.index]) {
                                            toolCalls[tc.index] = {
                                                id: tc.id || '',
                                                type: 'function',
                                                function: {
                                                    name: '',
                                                    arguments: '',
                                                },
                                            };
                                        }
                                        if (tc.id) {
                                            toolCalls[tc.index].id = tc.id;
                                        }
                                        if (tc.function?.name) {
                                            toolCalls[tc.index].function.name =
                                                tc.function.name;
                                        }
                                        if (tc.function?.arguments) {
                                            toolCalls[
                                                tc.index
                                            ].function.arguments +=
                                                tc.function.arguments;
                                        }
                                    }
                                }
                            }
                        } catch {
                            // Ignore parse errors for incomplete chunks
                        }
                    }
                }
            }

            // Check if we have tool calls to process
            if (toolCalls.length > 0) {
                // Add assistant message with tool calls
                apiMessages.push({
                    role: 'assistant',
                    content: assistantContent || null,
                    tool_calls: toolCalls,
                });

                // Execute each tool call
                for (const tc of toolCalls) {
                    console.log('[AI Agent] Executing tool:', tc.function.name);

                    const toolCall: ToolCall = {
                        id: tc.id,
                        name: tc.function.name,
                        arguments: JSON.parse(tc.function.arguments),
                    };
                    onToolCall(toolCall);

                    const result = await executeToolCall(
                        tc.function.name as ToolName,
                        JSON.parse(tc.function.arguments),
                        chartDB
                    );
                    result.toolCallId = tc.id;
                    onToolResult(result);

                    // Add tool result to messages
                    apiMessages.push({
                        role: 'tool',
                        content: result.success
                            ? (result.result ?? 'Success')
                            : `Error: ${result.error}`,
                        tool_call_id: tc.id,
                    });
                }
            } else {
                // No tool calls, we're done
                continueLoop = false;
            }
        }

        console.log('[AI Agent] Complete. Response length:', fullText.length);
        onComplete(fullText);
    } catch (error: unknown) {
        console.error('[AI Agent] Error:', error);
        if (error instanceof Error && error.name === 'AbortError') {
            return;
        }
        onError(
            error instanceof Error ? error : new Error('Unknown error occurred')
        );
    }
};
