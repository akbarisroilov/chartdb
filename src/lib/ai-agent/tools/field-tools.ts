import type { ChartDBContext } from '@/context/chartdb-context/chartdb-context';
import type {
    ToolResult,
    AddFieldParams,
    UpdateFieldParams,
    DeleteFieldParams,
} from '../types';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import { generateId } from '@/lib/utils';

const findTableByName = (
    tables: DBTable[],
    name: string
): DBTable | undefined => {
    const normalizedName = name.toLowerCase();
    return tables.find((t) => t.name.toLowerCase() === normalizedName);
};

const findFieldByName = (
    table: DBTable,
    fieldName: string
): DBField | undefined => {
    const normalizedName = fieldName.toLowerCase();
    return table.fields.find((f) => f.name.toLowerCase() === normalizedName);
};

export const executeAddField = async (
    params: AddFieldParams,
    chartDB: ChartDBContext
): Promise<ToolResult> => {
    try {
        const { tables } = chartDB;

        const table = findTableByName(tables, params.tableName);
        if (!table) {
            return {
                toolCallId: '',
                toolName: 'add_field',
                success: false,
                error: `Table "${params.tableName}" not found.`,
            };
        }

        // Check if field already exists
        if (findFieldByName(table, params.fieldName)) {
            return {
                toolCallId: '',
                toolName: 'add_field',
                success: false,
                error: `Field "${params.fieldName}" already exists in table "${params.tableName}".`,
            };
        }

        const typeName = params.fieldType.toLowerCase();
        const isPrimaryKey = params.primaryKey ?? false;

        const field: DBField = {
            id: generateId(),
            name: params.fieldName.toLowerCase(),
            type: { id: typeName, name: typeName },
            primaryKey: isPrimaryKey,
            nullable: params.nullable ?? !isPrimaryKey,
            unique: params.unique ?? isPrimaryKey,
            default: params.default ?? null,
            createdAt: Date.now(),
        };

        await chartDB.addField(table.id, field);

        return {
            toolCallId: '',
            toolName: 'add_field',
            success: true,
            result: `Added field "${field.name}" (${field.type.name}) to table "${params.tableName}"`,
        };
    } catch (error) {
        return {
            toolCallId: '',
            toolName: 'add_field',
            success: false,
            error: `Failed to add field: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};

export const executeUpdateField = async (
    params: UpdateFieldParams,
    chartDB: ChartDBContext
): Promise<ToolResult> => {
    try {
        const { tables } = chartDB;

        const table = findTableByName(tables, params.tableName);
        if (!table) {
            return {
                toolCallId: '',
                toolName: 'update_field',
                success: false,
                error: `Table "${params.tableName}" not found.`,
            };
        }

        const field = findFieldByName(table, params.fieldName);
        if (!field) {
            return {
                toolCallId: '',
                toolName: 'update_field',
                success: false,
                error: `Field "${params.fieldName}" not found in table "${params.tableName}".`,
            };
        }

        // Check if new name already exists (if renaming)
        if (
            params.newName &&
            params.newName.toLowerCase() !== params.fieldName.toLowerCase()
        ) {
            if (findFieldByName(table, params.newName)) {
                return {
                    toolCallId: '',
                    toolName: 'update_field',
                    success: false,
                    error: `Field "${params.newName}" already exists in table "${params.tableName}".`,
                };
            }
        }

        const updates: Partial<DBField> = {};
        const changes: string[] = [];

        if (params.newName) {
            updates.name = params.newName.toLowerCase();
            changes.push(`renamed to "${params.newName.toLowerCase()}"`);
        }

        if (params.newType) {
            const typeName = params.newType.toLowerCase();
            updates.type = { id: typeName, name: typeName };
            changes.push(`type changed to "${typeName}"`);
        }

        if (params.nullable !== undefined) {
            updates.nullable = params.nullable;
            changes.push(
                params.nullable ? 'set to nullable' : 'set to not nullable'
            );
        }

        if (params.unique !== undefined) {
            updates.unique = params.unique;
            changes.push(
                params.unique ? 'set to unique' : 'unique constraint removed'
            );
        }

        if (params.default !== undefined) {
            updates.default = params.default || null;
            changes.push(
                params.default
                    ? `default set to "${params.default}"`
                    : 'default removed'
            );
        }

        if (Object.keys(updates).length === 0) {
            return {
                toolCallId: '',
                toolName: 'update_field',
                success: false,
                error: 'No updates specified for the field.',
            };
        }

        await chartDB.updateField(table.id, field.id, updates);

        return {
            toolCallId: '',
            toolName: 'update_field',
            success: true,
            result: `Updated field "${params.fieldName}" in table "${params.tableName}": ${changes.join(', ')}`,
        };
    } catch (error) {
        return {
            toolCallId: '',
            toolName: 'update_field',
            success: false,
            error: `Failed to update field: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};

export const executeDeleteField = async (
    params: DeleteFieldParams,
    chartDB: ChartDBContext
): Promise<ToolResult> => {
    try {
        const { tables } = chartDB;

        const table = findTableByName(tables, params.tableName);
        if (!table) {
            return {
                toolCallId: '',
                toolName: 'delete_field',
                success: false,
                error: `Table "${params.tableName}" not found.`,
            };
        }

        const field = findFieldByName(table, params.fieldName);
        if (!field) {
            return {
                toolCallId: '',
                toolName: 'delete_field',
                success: false,
                error: `Field "${params.fieldName}" not found in table "${params.tableName}".`,
            };
        }

        // Warn if deleting primary key
        if (
            field.primaryKey &&
            table.fields.filter((f) => f.primaryKey).length === 1
        ) {
            return {
                toolCallId: '',
                toolName: 'delete_field',
                success: false,
                error: `Cannot delete the only primary key field "${params.fieldName}" from table "${params.tableName}".`,
            };
        }

        await chartDB.removeField(table.id, field.id);

        return {
            toolCallId: '',
            toolName: 'delete_field',
            success: true,
            result: `Deleted field "${params.fieldName}" from table "${params.tableName}"`,
        };
    } catch (error) {
        return {
            toolCallId: '',
            toolName: 'delete_field',
            success: false,
            error: `Failed to delete field: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};
