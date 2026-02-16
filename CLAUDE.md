# ChartDB - Project Reference for Claude

## Project Overview

ChartDB is a database schema visualization and design tool built with React, TypeScript, and Vite. It allows users to create, visualize, and export database diagrams with support for multiple database types.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **State Management:** React Context API
- **UI Components:** Radix UI primitives, Tailwind CSS, shadcn/ui patterns
- **Diagram Rendering:** @xyflow/react (React Flow)
- **AI Integration:** Vercel AI SDK v5 (`ai` + `@ai-sdk/openai`)
- **Internationalization:** react-i18next (22 locales)
- **Code Editor:** Monaco Editor

## Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── ai-agent-chat/   # AI assistant chat UI
│   ├── button/          # Button component
│   ├── card/            # Card component
│   ├── sheet/           # Slide-in panel (Radix)
│   └── ...
├── context/             # React Context providers
│   ├── ai-agent-context/    # AI assistant state
│   ├── chartdb-context/     # Main diagram state & actions
│   ├── history-context/     # Undo/redo
│   ├── theme-context/       # Dark/light theme
│   └── ...
├── hooks/               # Custom React hooks
├── i18n/
│   └── locales/         # Translation files (22 languages)
├── lib/
│   ├── ai-agent/        # AI assistant logic
│   │   ├── tools/       # Tool definitions & executors
│   │   ├── ai-agent-service.ts
│   │   ├── schema-serializer.ts
│   │   └── types.ts
│   ├── data/            # Data utilities
│   │   └── sql-export/  # SQL generation
│   ├── domain/          # Domain models
│   │   ├── db-table.ts
│   │   ├── db-field.ts
│   │   ├── db-relationship.ts
│   │   └── diagram.ts
│   └── env.ts           # Environment variables
├── pages/
│   └── editor-page/     # Main editor
│       ├── canvas/      # Diagram canvas
│       │   └── toolbar/ # Canvas toolbar
│       └── side-panel/  # Left sidebar
└── App.tsx
```

## Key Files

### Domain Models
- `src/lib/domain/db-table.ts` - DBTable interface
- `src/lib/domain/db-field.ts` - DBField interface
- `src/lib/domain/db-relationship.ts` - DBRelationship interface
- `src/lib/domain/diagram.ts` - Diagram interface

### Main Context (ChartDB)
- `src/context/chartdb-context/chartdb-context.tsx` - Context definition with all actions
- `src/context/chartdb-context/chartdb-provider.tsx` - Provider implementation

Key actions available in ChartDBContext:
- `createTable(table)` / `removeTable(id)` / `updateTable(id, table)`
- `addField(tableId, field)` / `updateField(tableId, fieldId, field)` / `removeField(tableId, fieldId)`
- `createRelationship(rel)` / `removeRelationship(id)`
- `currentDiagram` - Current diagram state

### AI Agent System
- `src/lib/ai-agent/types.ts` - ChatMessage, ToolCall, ToolResult types
- `src/lib/ai-agent/tools/tool-definitions.ts` - Tool schemas (uses `tool()` from 'ai')
- `src/lib/ai-agent/ai-agent-service.ts` - Main AI service with streaming
- `src/context/ai-agent-context/` - AI chat state management

### Environment Variables
Defined in `src/lib/env.ts`, loaded from `.env`:
- `VITE_OPENAI_API_KEY` - OpenAI API key
- `VITE_OPENAI_API_ENDPOINT` - Custom endpoint (optional)
- `VITE_LLM_MODEL_NAME` - Model name (default: gpt-4o-mini)

## Coding Patterns

### Context Pattern
Every context follows this pattern:
```typescript
// context-name-context.tsx
export interface ContextType { ... }
export const SomeContext = createContext<ContextType>(defaultValue);

// context-name-provider.tsx
export const SomeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // state and actions
  return <SomeContext.Provider value={...}>{children}</SomeContext.Provider>
}

// use-context-name.ts
export const useSomething = () => useContext(SomeContext);
```

### Component Pattern
Components use shadcn/ui conventions:
- Functional components with TypeScript
- Props interfaces
- Tailwind CSS for styling
- `cn()` utility for conditional classes

### i18n Pattern
All 22 locale files must have identical structure. When adding translations:
1. Add to `src/i18n/locales/en.ts` first
2. Copy the same keys to all other locale files
3. TypeScript will error if any locale is missing keys

Locale files: ar, bn, de, en, es, fr, gu, hi, hr, id_ID, ja, ko_KR, mr, ne, pt_BR, ru, te, tr, uk, vi, zh_CN, zh_TW

### AI SDK v5 Patterns
```typescript
import { tool, streamText, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Tool definition
const myTool = tool({
  description: 'Tool description',
  inputSchema: z.object({ ... }),  // NOT 'parameters'
});

// Streaming with tools
const result = streamText({
  model: openai(modelName),
  tools: { ... },
  stopWhen: stepCountIs(5),  // NOT 'maxSteps'
  onStepFinish: async (step) => {
    // step.toolCalls[].input  // NOT 'args'
  }
});
```

## Build Commands

```bash
npm run dev          # Development server
npm run build        # Production build (runs lint + tsc + vite build)
npm run lint         # ESLint check
npm run lint -- --fix # Auto-fix lint issues
```

## Important Notes

1. **Provider Nesting Order** - See `src/pages/editor-page/editor-page.tsx` for correct order
2. **Undo/Redo** - All diagram changes should go through ChartDBContext for history support
3. **Tool Execution** - AI tools execute via ChartDBContext methods, enabling undo/redo
4. **Type Safety** - Use `as unknown as Type` for safe type casting when needed
5. **Prettier** - Run `npm run lint -- --fix` after editing to fix formatting

## Database Types Supported

Defined in `src/lib/domain/database-type.ts`:
- PostgreSQL, MySQL, MariaDB, SQLite
- SQL Server, Oracle, CockroachDB
- ClickHouse, and more

## Recent Changes (AI Agent Feature)

Added AI assistant that can create/modify tables via natural language:
- Toggle via Sparkles icon in toolbar
- Uses OpenAI function calling
- Supports: create_table, add_field, update_field, delete_field, rename_table, delete_table, create_relationship, delete_relationship, get_schema_info
