import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';

export const serializeTableToText = (table: DBTable): string => {
    const lines: string[] = [];

    const schemaPrefix = table.schema ? `${table.schema}.` : '';
    lines.push(`Table: ${schemaPrefix}${table.name}`);

    if (table.fields.length > 0) {
        lines.push('  Fields:');
        for (const field of table.fields) {
            const constraints: string[] = [];
            if (field.primaryKey) constraints.push('PK');
            if (!field.nullable) constraints.push('NOT NULL');
            if (field.unique) constraints.push('UNIQUE');
            if (field.increment) constraints.push('AUTO_INCREMENT');
            if (field.default) constraints.push(`DEFAULT: ${field.default}`);

            const constraintStr =
                constraints.length > 0 ? ` [${constraints.join(', ')}]` : '';
            lines.push(
                `    - ${field.name}: ${field.type.name}${constraintStr}`
            );
        }
    } else {
        lines.push('  Fields: (none)');
    }

    if (table.indexes.length > 0) {
        const nonPkIndexes = table.indexes.filter((idx) => !idx.isPrimaryKey);
        if (nonPkIndexes.length > 0) {
            lines.push('  Indexes:');
            for (const index of nonPkIndexes) {
                const fieldNames = index.fieldIds
                    .map((id) => table.fields.find((f) => f.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');
                const uniqueStr = index.unique ? ' (UNIQUE)' : '';
                lines.push(`    - ${index.name}: [${fieldNames}]${uniqueStr}`);
            }
        }
    }

    return lines.join('\n');
};

export const serializeRelationshipToText = (
    relationship: DBRelationship,
    tables: DBTable[]
): string => {
    const sourceTable = tables.find((t) => t.id === relationship.sourceTableId);
    const targetTable = tables.find((t) => t.id === relationship.targetTableId);

    if (!sourceTable || !targetTable) {
        return '';
    }

    const sourceField = sourceTable.fields.find(
        (f) => f.id === relationship.sourceFieldId
    );
    const targetField = targetTable.fields.find(
        (f) => f.id === relationship.targetFieldId
    );

    if (!sourceField || !targetField) {
        return '';
    }

    const cardinality = `${relationship.sourceCardinality}:${relationship.targetCardinality}`;

    return `${sourceTable.name}.${sourceField.name} -> ${targetTable.name}.${targetField.name} (${cardinality})`;
};

export const serializeDiagramToText = (diagram: Diagram): string => {
    const lines: string[] = [];

    lines.push(`Database Type: ${diagram.databaseType}`);
    lines.push('');

    const tables = diagram.tables ?? [];
    const relationships = diagram.relationships ?? [];

    if (tables.length === 0) {
        lines.push('No tables in the schema.');
    } else {
        lines.push(`Tables (${tables.length}):`);
        lines.push('');

        for (const table of tables) {
            if (!table.isView) {
                lines.push(serializeTableToText(table));
                lines.push('');
            }
        }

        const views = tables.filter((t) => t.isView);
        if (views.length > 0) {
            lines.push(`Views (${views.length}):`);
            for (const view of views) {
                lines.push(`  - ${view.name}`);
            }
            lines.push('');
        }
    }

    if (relationships.length > 0) {
        lines.push(`Relationships (${relationships.length}):`);
        for (const rel of relationships) {
            const relText = serializeRelationshipToText(rel, tables);
            if (relText) {
                lines.push(`  - ${relText}`);
            }
        }
    }

    return lines.join('\n');
};

export const generateSystemPrompt = (diagram: Diagram): string => {
    const schemaContext = serializeDiagramToText(diagram);

    return `You are a database schema design assistant for ChartDB.
Your role is to help users create and modify database tables, fields, and relationships.

When users ask you to make changes:
1. Understand their intent clearly
2. Use the available tools to make the requested changes
3. Explain what changes you made in a friendly, concise way

Guidelines:
- For primary keys, prefer using "bigint" type unless the user specifies otherwise
- Table names should be lowercase with underscores (snake_case)
- Field names should also be snake_case
- When creating a table, always include an "id" field as the primary key unless the user specifies otherwise
- Common field types: bigint, integer, varchar, text, boolean, timestamp, date, decimal
- When the user mentions "string" or "text" fields, use "varchar" for shorter strings and "text" for longer ones
- For timestamps, use "timestamp" type

Current database schema:
${schemaContext}

If the schema is empty, help the user create their first table.
If you need to understand the current schema before making changes, use the get_schema_info tool.`;
};
