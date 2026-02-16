import type { ChartDBContext } from '@/context/chartdb-context/chartdb-context';
import type {
    ToolResult,
    CreateTableParams,
    RenameTableParams,
    DeleteTableParams,
    FieldDefinition,
} from '../types';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import { generateId } from '@/lib/utils';
import { getDefaultPrimaryKeyType } from '@/lib/data/data-types/data-types';

const findTableByName = (
    tables: DBTable[],
    name: string
): DBTable | undefined => {
    const normalizedName = name.toLowerCase();
    return tables.find((t) => t.name.toLowerCase() === normalizedName);
};

const createFieldFromDefinition = (
    fieldDef: FieldDefinition,
    databaseType: ChartDBContext['databaseType']
): DBField => {
    const typeName = fieldDef.type.toLowerCase();
    const isPrimaryKey = fieldDef.primaryKey ?? false;

    return {
        id: generateId(),
        name: fieldDef.name,
        type:
            isPrimaryKey && typeName === 'bigint'
                ? getDefaultPrimaryKeyType(databaseType)
                : { id: typeName, name: typeName },
        primaryKey: isPrimaryKey,
        nullable: fieldDef.nullable ?? !isPrimaryKey,
        unique: fieldDef.unique ?? isPrimaryKey,
        default: fieldDef.default ?? null,
        createdAt: Date.now(),
    };
};

export const executeCreateTable = async (
    params: CreateTableParams,
    chartDB: ChartDBContext
): Promise<ToolResult> => {
    try {
        const { tables, databaseType } = chartDB;

        // Check if table already exists
        if (findTableByName(tables, params.name)) {
            return {
                toolCallId: '',
                toolName: 'create_table',
                success: false,
                error: `Table "${params.name}" already exists.`,
            };
        }

        let fields: DBField[] = [];

        if (params.fields && params.fields.length > 0) {
            fields = params.fields.map((f) =>
                createFieldFromDefinition(f, databaseType)
            );

            // Ensure there's at least one primary key if none specified
            const hasPrimaryKey = fields.some((f) => f.primaryKey);
            if (!hasPrimaryKey) {
                // Add an id field as primary key
                fields.unshift({
                    id: generateId(),
                    name: 'id',
                    type: getDefaultPrimaryKeyType(databaseType),
                    primaryKey: true,
                    nullable: false,
                    unique: true,
                    createdAt: Date.now(),
                });
            }
        }

        const tableAttributes: Partial<Omit<DBTable, 'id'>> = {
            name: params.name.toLowerCase(),
            schema: params.schema,
        };

        if (fields.length > 0) {
            tableAttributes.fields = fields;
        }

        const table = await chartDB.createTable(tableAttributes);

        const fieldNames = table.fields.map((f) => f.name).join(', ');

        return {
            toolCallId: '',
            toolName: 'create_table',
            success: true,
            result: `Created table "${table.name}" with fields: ${fieldNames}`,
        };
    } catch (error) {
        return {
            toolCallId: '',
            toolName: 'create_table',
            success: false,
            error: `Failed to create table: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};

export const executeRenameTable = async (
    params: RenameTableParams,
    chartDB: ChartDBContext
): Promise<ToolResult> => {
    try {
        const { tables } = chartDB;

        const table = findTableByName(tables, params.oldName);
        if (!table) {
            return {
                toolCallId: '',
                toolName: 'rename_table',
                success: false,
                error: `Table "${params.oldName}" not found.`,
            };
        }

        // Check if new name already exists
        if (findTableByName(tables, params.newName)) {
            return {
                toolCallId: '',
                toolName: 'rename_table',
                success: false,
                error: `Table "${params.newName}" already exists.`,
            };
        }

        await chartDB.updateTable(table.id, {
            name: params.newName.toLowerCase(),
        });

        return {
            toolCallId: '',
            toolName: 'rename_table',
            success: true,
            result: `Renamed table "${params.oldName}" to "${params.newName.toLowerCase()}"`,
        };
    } catch (error) {
        return {
            toolCallId: '',
            toolName: 'rename_table',
            success: false,
            error: `Failed to rename table: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};

export const executeDeleteTable = async (
    params: DeleteTableParams,
    chartDB: ChartDBContext
): Promise<ToolResult> => {
    try {
        const { tables } = chartDB;

        const table = findTableByName(tables, params.tableName);
        if (!table) {
            return {
                toolCallId: '',
                toolName: 'delete_table',
                success: false,
                error: `Table "${params.tableName}" not found.`,
            };
        }

        await chartDB.removeTable(table.id);

        return {
            toolCallId: '',
            toolName: 'delete_table',
            success: true,
            result: `Deleted table "${params.tableName}"`,
        };
    } catch (error) {
        return {
            toolCallId: '',
            toolName: 'delete_table',
            success: false,
            error: `Failed to delete table: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};
