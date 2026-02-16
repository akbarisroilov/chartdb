import type { ChartDBContext } from '@/context/chartdb-context/chartdb-context';
import type {
    ToolResult,
    CreateRelationshipParams,
    DeleteRelationshipParams,
    GetSchemaInfoParams,
} from '../types';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import type { Cardinality } from '@/lib/domain/db-relationship';
import {
    serializeDiagramToText,
    serializeTableToText,
} from '../schema-serializer';

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

const parseRelationshipType = (
    type?: string
): { sourceCardinality: Cardinality; targetCardinality: Cardinality } => {
    switch (type) {
        case 'one_to_one':
            return { sourceCardinality: 'one', targetCardinality: 'one' };
        case 'many_to_one':
            return { sourceCardinality: 'many', targetCardinality: 'one' };
        case 'many_to_many':
            return { sourceCardinality: 'many', targetCardinality: 'many' };
        case 'one_to_many':
        default:
            return { sourceCardinality: 'one', targetCardinality: 'many' };
    }
};

export const executeCreateRelationship = async (
    params: CreateRelationshipParams,
    chartDB: ChartDBContext
): Promise<ToolResult> => {
    try {
        const { tables, relationships } = chartDB;

        const sourceTable = findTableByName(tables, params.sourceTable);
        if (!sourceTable) {
            return {
                toolCallId: '',
                toolName: 'create_relationship',
                success: false,
                error: `Source table "${params.sourceTable}" not found.`,
            };
        }

        const targetTable = findTableByName(tables, params.targetTable);
        if (!targetTable) {
            return {
                toolCallId: '',
                toolName: 'create_relationship',
                success: false,
                error: `Target table "${params.targetTable}" not found.`,
            };
        }

        const sourceField = findFieldByName(sourceTable, params.sourceField);
        if (!sourceField) {
            return {
                toolCallId: '',
                toolName: 'create_relationship',
                success: false,
                error: `Field "${params.sourceField}" not found in source table "${params.sourceTable}".`,
            };
        }

        const targetField = findFieldByName(targetTable, params.targetField);
        if (!targetField) {
            return {
                toolCallId: '',
                toolName: 'create_relationship',
                success: false,
                error: `Field "${params.targetField}" not found in target table "${params.targetTable}".`,
            };
        }

        // Check if relationship already exists
        const existingRelationship = relationships.find(
            (r) =>
                r.sourceTableId === sourceTable.id &&
                r.sourceFieldId === sourceField.id &&
                r.targetTableId === targetTable.id &&
                r.targetFieldId === targetField.id
        );

        if (existingRelationship) {
            return {
                toolCallId: '',
                toolName: 'create_relationship',
                success: false,
                error: `A relationship already exists between ${params.sourceTable}.${params.sourceField} and ${params.targetTable}.${params.targetField}.`,
            };
        }

        await chartDB.createRelationship({
            sourceTableId: sourceTable.id,
            sourceFieldId: sourceField.id,
            targetTableId: targetTable.id,
            targetFieldId: targetField.id,
        });

        // Update the cardinality if specified
        if (params.type) {
            const { sourceCardinality, targetCardinality } =
                parseRelationshipType(params.type);
            const newRelationship = chartDB.relationships.find(
                (r) =>
                    r.sourceTableId === sourceTable.id &&
                    r.sourceFieldId === sourceField.id &&
                    r.targetTableId === targetTable.id &&
                    r.targetFieldId === targetField.id
            );
            if (newRelationship) {
                await chartDB.updateRelationship(newRelationship.id, {
                    sourceCardinality,
                    targetCardinality,
                });
            }
        }

        const typeStr = params.type
            ? ` (${params.type.replace('_', ' to ')})`
            : '';

        return {
            toolCallId: '',
            toolName: 'create_relationship',
            success: true,
            result: `Created relationship: ${params.sourceTable}.${params.sourceField} -> ${params.targetTable}.${params.targetField}${typeStr}`,
        };
    } catch (error) {
        return {
            toolCallId: '',
            toolName: 'create_relationship',
            success: false,
            error: `Failed to create relationship: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};

export const executeDeleteRelationship = async (
    params: DeleteRelationshipParams,
    chartDB: ChartDBContext
): Promise<ToolResult> => {
    try {
        const { tables, relationships } = chartDB;

        const sourceTable = findTableByName(tables, params.sourceTable);
        if (!sourceTable) {
            return {
                toolCallId: '',
                toolName: 'delete_relationship',
                success: false,
                error: `Source table "${params.sourceTable}" not found.`,
            };
        }

        const targetTable = findTableByName(tables, params.targetTable);
        if (!targetTable) {
            return {
                toolCallId: '',
                toolName: 'delete_relationship',
                success: false,
                error: `Target table "${params.targetTable}" not found.`,
            };
        }

        const sourceField = findFieldByName(sourceTable, params.sourceField);
        if (!sourceField) {
            return {
                toolCallId: '',
                toolName: 'delete_relationship',
                success: false,
                error: `Field "${params.sourceField}" not found in source table "${params.sourceTable}".`,
            };
        }

        const targetField = findFieldByName(targetTable, params.targetField);
        if (!targetField) {
            return {
                toolCallId: '',
                toolName: 'delete_relationship',
                success: false,
                error: `Field "${params.targetField}" not found in target table "${params.targetTable}".`,
            };
        }

        const relationship = relationships.find(
            (r) =>
                r.sourceTableId === sourceTable.id &&
                r.sourceFieldId === sourceField.id &&
                r.targetTableId === targetTable.id &&
                r.targetFieldId === targetField.id
        );

        if (!relationship) {
            return {
                toolCallId: '',
                toolName: 'delete_relationship',
                success: false,
                error: `No relationship found between ${params.sourceTable}.${params.sourceField} and ${params.targetTable}.${params.targetField}.`,
            };
        }

        await chartDB.removeRelationship(relationship.id);

        return {
            toolCallId: '',
            toolName: 'delete_relationship',
            success: true,
            result: `Deleted relationship: ${params.sourceTable}.${params.sourceField} -> ${params.targetTable}.${params.targetField}`,
        };
    } catch (error) {
        return {
            toolCallId: '',
            toolName: 'delete_relationship',
            success: false,
            error: `Failed to delete relationship: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};

export const executeGetSchemaInfo = (
    params: GetSchemaInfoParams,
    chartDB: ChartDBContext
): ToolResult => {
    try {
        const { tables, currentDiagram } = chartDB;

        if (params.tableName) {
            const table = findTableByName(tables, params.tableName);
            if (!table) {
                return {
                    toolCallId: '',
                    toolName: 'get_schema_info',
                    success: false,
                    error: `Table "${params.tableName}" not found.`,
                };
            }

            return {
                toolCallId: '',
                toolName: 'get_schema_info',
                success: true,
                result: serializeTableToText(table),
            };
        }

        return {
            toolCallId: '',
            toolName: 'get_schema_info',
            success: true,
            result: serializeDiagramToText(currentDiagram),
        };
    } catch (error) {
        return {
            toolCallId: '',
            toolName: 'get_schema_info',
            success: false,
            error: `Failed to get schema info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
};
