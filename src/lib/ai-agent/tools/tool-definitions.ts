import { tool } from 'ai';
import { z } from 'zod';

export const createTableTool = tool({
    description:
        'Create a new database table with optional fields. Use this when the user wants to create a new table.',
    inputSchema: z.object({
        name: z
            .string()
            .describe(
                'The name of the table to create (e.g., "users", "orders")'
            ),
        fields: z
            .array(
                z.object({
                    name: z.string().describe('The name of the field'),
                    type: z
                        .string()
                        .describe(
                            'The data type of the field (e.g., "bigint", "varchar", "boolean", "timestamp")'
                        ),
                    primaryKey: z
                        .boolean()
                        .optional()
                        .describe('Whether this field is a primary key'),
                    nullable: z
                        .boolean()
                        .optional()
                        .describe(
                            'Whether this field can be null (default: true)'
                        ),
                    unique: z
                        .boolean()
                        .optional()
                        .describe('Whether this field must be unique'),
                    default: z
                        .string()
                        .optional()
                        .describe('The default value for this field'),
                })
            )
            .optional()
            .describe(
                'Array of fields to create with the table. If not provided, a table with just an id field will be created.'
            ),
        schema: z
            .string()
            .optional()
            .describe('The schema to create the table in (optional)'),
    }),
});

export const addFieldTool = tool({
    description:
        'Add a new field (column) to an existing table. Use this when the user wants to add a column to a table.',
    inputSchema: z.object({
        tableName: z
            .string()
            .describe('The name of the table to add the field to'),
        fieldName: z.string().describe('The name of the new field'),
        fieldType: z
            .string()
            .describe(
                'The data type of the field (e.g., "bigint", "varchar", "boolean", "timestamp")'
            ),
        primaryKey: z
            .boolean()
            .optional()
            .describe('Whether this field is a primary key'),
        nullable: z
            .boolean()
            .optional()
            .describe('Whether this field can be null (default: true)'),
        unique: z
            .boolean()
            .optional()
            .describe('Whether this field must be unique'),
        default: z
            .string()
            .optional()
            .describe('The default value for this field'),
    }),
});

export const updateFieldTool = tool({
    description:
        'Update an existing field in a table. Use this to rename a field, change its type, or modify its constraints.',
    inputSchema: z.object({
        tableName: z
            .string()
            .describe('The name of the table containing the field'),
        fieldName: z.string().describe('The current name of the field'),
        newName: z.string().optional().describe('The new name for the field'),
        newType: z
            .string()
            .optional()
            .describe('The new data type for the field'),
        nullable: z
            .boolean()
            .optional()
            .describe('Whether this field can be null'),
        unique: z
            .boolean()
            .optional()
            .describe('Whether this field must be unique'),
        default: z
            .string()
            .optional()
            .describe('The new default value for this field'),
    }),
});

export const deleteFieldTool = tool({
    description:
        'Delete a field (column) from a table. Use this when the user wants to remove a column.',
    inputSchema: z.object({
        tableName: z
            .string()
            .describe('The name of the table containing the field'),
        fieldName: z.string().describe('The name of the field to delete'),
    }),
});

export const renameTableTool = tool({
    description:
        'Rename an existing table. Use this when the user wants to change the name of a table.',
    inputSchema: z.object({
        oldName: z.string().describe('The current name of the table'),
        newName: z.string().describe('The new name for the table'),
    }),
});

export const deleteTableTool = tool({
    description:
        'Delete a table from the schema. Use this when the user wants to remove a table entirely.',
    inputSchema: z.object({
        tableName: z.string().describe('The name of the table to delete'),
    }),
});

export const createRelationshipTool = tool({
    description:
        'Create a relationship (foreign key) between two tables. Use this when the user wants to link tables together.',
    inputSchema: z.object({
        sourceTable: z
            .string()
            .describe(
                'The name of the source table (the one with the foreign key)'
            ),
        sourceField: z
            .string()
            .describe('The name of the field in the source table'),
        targetTable: z
            .string()
            .describe(
                'The name of the target table (the one being referenced)'
            ),
        targetField: z
            .string()
            .describe(
                'The name of the field in the target table being referenced (usually the primary key)'
            ),
        type: z
            .enum(['one_to_one', 'one_to_many', 'many_to_one', 'many_to_many'])
            .optional()
            .describe(
                'The type of relationship. Default is one_to_many (one target record can have many source records).'
            ),
    }),
});

export const deleteRelationshipTool = tool({
    description:
        'Delete a relationship between two tables. Use this when the user wants to remove a foreign key relationship.',
    inputSchema: z.object({
        sourceTable: z.string().describe('The name of the source table'),
        sourceField: z
            .string()
            .describe('The name of the field in the source table'),
        targetTable: z.string().describe('The name of the target table'),
        targetField: z
            .string()
            .describe('The name of the field in the target table'),
    }),
});

export const getSchemaInfoTool = tool({
    description:
        'Get information about the current database schema. Use this to understand what tables and fields exist before making changes.',
    inputSchema: z.object({
        tableName: z
            .string()
            .optional()
            .describe(
                'Optional: Get info about a specific table. If not provided, returns info about all tables.'
            ),
    }),
});

export const allTools = {
    create_table: createTableTool,
    add_field: addFieldTool,
    update_field: updateFieldTool,
    delete_field: deleteFieldTool,
    rename_table: renameTableTool,
    delete_table: deleteTableTool,
    create_relationship: createRelationshipTool,
    delete_relationship: deleteRelationshipTool,
    get_schema_info: getSchemaInfoTool,
};

export type ToolName = keyof typeof allTools;
