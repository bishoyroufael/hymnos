# Database Layer - PGlite with Raw SQL

## Overview

This database layer uses **PGlite** (WASM PostgreSQL) running entirely in the browser with:
- **IndexedDB persistence** - Data survives page reloads
- **Raw SQL migrations** - Matching the original Expo app for parallel development
- **Optimized import** - Data loaded before indices for better performance
- **State-based initialization** - Clean callback API with `DBInitState` enum

---

## Quick Start

### Initialization

The database initializes automatically when the app starts:

```typescript
// src/App.tsx
const [dbState, setDbState] = useState(DBInitState.IN_PROGRESS);

useEffect(() => {
  initDB((state, error) => {
    setDbState(state);
    if (state === DBInitState.ERROR) {
      console.error('DB Error:', error);
    }
  });
}, []);
```

### Using the Database

```typescript
import { getDB } from '@db/client';

const db = getDB(); // Get singleton instance

// Simple query
const packs = await db.query('SELECT * FROM pack');

// Parameterized query
const pack = await db.query(
  'SELECT * FROM pack WHERE uuid = $1',
  [packUuid]
);

// Call stored function
const result = await db.query(
  'SELECT * FROM get_pack_json_paged_ultra_fast($1, $2, $3)',
  [packUuid, 0, 100]
);
```

---

## Architecture

### Database Client ([client.ts](./client.ts))

**Main exports:**
- `initDB(callback?)` - Initialize database with optional progress callback
- `getDB()` - Get PGlite instance (throws if not initialized)
- `isDatabaseEmpty()` - Check if database has tables

**Initialization flow:**
1. Create PGlite instance with IndexedDB (`idb://hymnos-pgdata`)
2. Enable extensions (pg_trgm, vector)
3. Configure performance settings
4. Check if database is empty
5. If empty: Run migrations and import data
6. Callback with `DBInitState.DONE` or `ERROR`

### State Management ([types.ts](./types.ts))

```typescript
export enum DBInitState {
  IN_PROGRESS = 'IN_PROGRESS',  // Initializing
  DONE = 'DONE',                // Ready
  ERROR = 'ERROR',              // Failed
}

export type DBInitCallback = (state: DBInitState, error?: string) => void;
```

**Benefits:**
- Clean state transitions
- No global state pollution
- Optional callback (won't break if not provided)
- Error message included with ERROR state

### Migration Order (Optimized!)

**Order matters for performance:**

1. **Create tables** (`SQL_INITIAL_MIGRATIONS`)
   - All table structures
   - Enums and constraints

2. **Diacritic handling** (`SQL_INSERT_DIACRITIC_MAP`, `SQL_REMOVE_DIACRITICS`)
   - Arabic text normalization
   - Diacritic removal function

3. **Import data** (`importInitialData()`)
   - Hymns from `hymns_pglite_import.zip` (8.4 MB)
   - Bibles from `bibles_pglite_import.zip` (4.0 MB)
   - **BEFORE views and indices!**

4. **Create views & functions** (`SQL_CREATE_VIEWS_FUNCTIONS`)
   - JSON aggregation views
   - Pagination functions

5. **Create indices** (`SQL_INDICES`)
   - Performance optimization
   - Created on populated tables (faster!)

**Why this order?**
- PostgreSQL can optimize index creation on populated tables
- Faster overall initialization
- Matches production database best practices

---

## File Structure

```
src/db/
├── client.ts                  # PGlite initialization & singleton
├── types.ts                   # DBInitState enum, callbacks
├── models.ts                  # Generated from OpenAPI schema
│
├── commands/                  # SQL migrations
│   ├── migrations.ts         # Tables & views SQL
│   ├── indices.ts            # Performance indices
│   ├── diacritic.ts          # Diacritic mapping
│   ├── views/                # Individual view files
│   │   ├── bible.ts
│   │   ├── liturgy.ts
│   │   ├── pack.ts
│   │   └── slide.ts
│   └── functions/            # Stored functions
│       ├── remove_diacritics.ts
│       ├── get_pack_paged.ts
│       └── ...
│
└── utils/                     # Database utilities
    ├── import.ts             # CSV import from ZIP
    └── export.ts             # Database export
```

---

## Data Import

### Bundled Data

Two ZIP files included in the build:
- `public/assets/hymns_pglite_import.zip` (8.4 MB)
- `public/assets/bibles_pglite_import.zip` (4.0 MB)

### Import Process

```typescript
// Automatic on first load
await importInitialData(db);

// Internally:
const hymnsBlob = await fetch('/assets/hymns_pglite_import.zip').then(r => r.blob());
await import_tables_from_zip(db, hymnsBlob, true);

const biblesBlob = await fetch('/assets/bibles_pglite_import.zip').then(r => r.blob());
await import_tables_from_zip(db, biblesBlob, true);
```

### ZIP File Format

Each ZIP contains CSV files named after database tables:
```
hymns_pglite_import.zip:
  ├─ content.csv
  ├─ hymn.csv
  ├─ slide.csv
  ├─ slide_row.csv
  └─ ...
```

### Direct Copy Mode

Using `should_direct_copy: true` for initial import:

```sql
-- Disable foreign key constraints
SET session_replication_role = 'replica';

-- Direct CSV import
COPY table_name FROM '/dev/blob' WITH (FORMAT csv, HEADER);

-- Re-enable constraints
SET session_replication_role = 'origin';
```

**Why direct copy?**
- Faster (no temp tables)
- Simpler (one-step process)
- Safe (database is empty, no conflicts)

---

## Usage Patterns

### React Router Loader Pattern

**Recommended approach for data fetching:**

```typescript
// Page loader function
export async function hymnLoader({ params }: LoaderFunctionArgs) {
  const db = getDB();
  const result = await db.query(
    `SELECT * FROM view_hymn_json WHERE uuid = $1`,
    [params.uuid]
  );

  if (result.rows.length === 0) {
    throw new Response("Hymn not found", { status: 404 });
  }

  return { hymn: result.rows[0] };
}

// Page component
export default function HymnViewPage() {
  const { hymn } = useLoaderData<typeof hymnLoader>();

  return (
    <div>
      <h1>{hymn.name}</h1>
      {/* ... */}
    </div>
  );
}
```

### Direct Database Mutations

```typescript
async function updateHymnName(uuid: string, newName: string) {
  const db = getDB();

  await db.query(
    `UPDATE hymn SET name = $1 WHERE uuid = $2`,
    [newName, uuid]
  );

  // Trigger revalidation if using React Router
  revalidator.revalidate();
}
```

### Using Views for Complex Data

```typescript
// View aggregates slides and rows into JSON
const result = await db.query(`
  SELECT * FROM view_hymn_json WHERE uuid = $1
`, [hymnUuid]);

// Result has pre-aggregated data:
// {
//   uuid: '...',
//   name: '...',
//   slides: [
//     { position: 1, rows: [...] },
//     { position: 2, rows: [...] }
//   ]
// }
```

### Search with pg_trgm

```typescript
// Fuzzy Arabic search
const results = await db.query(`
  SELECT
    uuid,
    name,
    similarity(name, $1) as score
  FROM hymn
  WHERE name % $1  -- % is the similarity operator
  ORDER BY score DESC
  LIMIT 20
`, [searchTerm]);
```

---

## Performance Optimization

### Indices

All performance-critical queries have indices:

```sql
-- Trigram index for fuzzy search
CREATE INDEX idx_hymn_name_trgm
  ON hymn USING GIST (name gist_trgm_ops);

-- Foreign key indices
CREATE INDEX idx_slide_content_uuid
  ON slide (content_uuid);

-- UUID lookups
CREATE INDEX idx_content_uuid
  ON content (uuid);
```

### Views with JSON Aggregation

Pre-computed views for complex queries:

```sql
CREATE VIEW view_hymn_json AS
SELECT
  h.uuid,
  h.name,
  json_agg(
    json_build_object(
      'uuid', s.uuid,
      'position', s.position,
      'rows', (
        SELECT json_agg(
          json_build_object(
            'content', sr.content,
            'header', sr.header
          ) ORDER BY sr.position
        )
        FROM slide_row sr
        WHERE sr.slide_uuid = s.uuid
      )
    ) ORDER BY s.position
  ) as slides
FROM hymn h
LEFT JOIN slide s ON s.content_uuid = h.uuid
GROUP BY h.uuid;
```

### Pagination Functions

Efficient pagination with stored functions:

```sql
CREATE FUNCTION get_pack_json_paged_ultra_fast(
  p_uuid UUID,
  p_offset INT,
  p_limit INT
) RETURNS TABLE(...) AS $$
  -- Optimized pagination logic
$$ LANGUAGE SQL STABLE;
```

---

## Development Workflow

### Making Schema Changes

1. **Edit SQL in `commands/migrations.ts`**
   ```typescript
   export const SQL_INITIAL_MIGRATIONS = `
     CREATE TABLE my_new_table (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name TEXT NOT NULL
     );
   `;
   ```

2. **Update OpenAPI schema** (if needed)
   ```bash
   # In backend/
   vim openapi/components/schemas/MyNewTable.yaml
   bash scripts/11_generate_models.sh
   ```

3. **Regenerate frontend models**
   ```bash
   npm run generate-db-models
   ```

4. **Test**
   - Clear IndexedDB: Chrome DevTools → Application → IndexedDB → Delete `hymnos-pgdata`
   - Reload page
   - Database reinitializes with new schema

### Adding New Views

1. **Create view file in `commands/views/`**
   ```typescript
   // commands/views/my_view.ts
   export const SQL_CREATE_MY_VIEW = `
     CREATE VIEW my_view AS
     SELECT ...
   `;
   ```

2. **Import in `migrations.ts`**
   ```typescript
   import { SQL_CREATE_MY_VIEW } from './views/my_view';

   export const SQL_CREATE_VIEWS_FUNCTIONS = `
     ${SQL_CREATE_MY_VIEW}
     ${/* other views */}
   `;
   ```

### Adding New Functions

Same pattern as views - create file, import, add to `SQL_CREATE_VIEWS_FUNCTIONS`.

---

## Troubleshooting

### Database Not Loading

**Check browser console:**
```
Initializing PGlite database...
Configuring database extensions...
Creating tables...
Setting up diacritic handling...
Importing initial data...
Importing hymns data...
Importing bibles data...
Creating views and functions...
Creating indices...
✓ All migrations and import complete
✓ Database ready
```

**If stuck:**
1. Clear IndexedDB (DevTools → Application → IndexedDB)
2. Check browser console for errors
3. Verify ZIP files exist in `public/assets/`

### Slow First Load

**Expected:** 2-3 minutes on first load (importing 12.4 MB of data)

**Subsequent loads:** Instant (data persisted in IndexedDB)

### Storage Quota Exceeded

Browser may limit IndexedDB storage (~100-200 MB typical).

**Solution:**
- Request persistent storage via Storage API
- Implement data cleanup/archival

### Extension Errors

```
Error: extension "pg_trgm" not found
```

**Fix:** Check imports in `client.ts`:
```typescript
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { vector } from '@electric-sql/pglite/vector';

new PGlite({
  extensions: { pg_trgm, vector },
});
```

---

## Testing

### Manual Testing

```typescript
// In browser console:
const { getDB } = await import('/src/db/client.ts');
const db = getDB();

// Test query
const result = await db.query('SELECT COUNT(*) FROM hymn');
console.log('Hymn count:', result.rows[0].count);

// Test search
const search = await db.query(`
  SELECT name, similarity(name, 'يا رب') as score
  FROM hymn
  WHERE name % 'يا رب'
  ORDER BY score DESC
  LIMIT 10
`);
console.table(search.rows);
```

### Resetting Database

```typescript
// In browser console:
// 1. Get database handle
const db = (await import('/src/db/client.ts')).getDB();

// 2. Close connection
await db.close();

// 3. Delete IndexedDB
indexedDB.deleteDatabase('hymnos-pgdata');

// 4. Reload page
location.reload();
```

---

## Migration Guide

### From Old App (Expo)

**Old approach:**
```typescript
import { usePGlite } from '@hooks/usePGlite';

const { db, loading } = usePGlite();

if (loading) return <LoadingScreen />;
```

**New approach:**
```typescript
import { getDB } from '@db/client';

// In loader or component:
const db = getDB();
const result = await db.query(/* ... */);
```

**Key differences:**
- No hook needed (singleton pattern)
- No loading state (handled in App.tsx)
- Same SQL queries (compatible!)

---

## Related Documentation

- [PGLITE_SETUP.md](../../PGLITE_SETUP.md) - Extension configuration details
- [DATA_IMPORT_SUMMARY.md](../../DATA_IMPORT_SUMMARY.md) - Import system deep dive
- [DB_CALLBACK_REFACTOR.md](../../DB_CALLBACK_REFACTOR.md) - State management explanation
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Overall frontend architecture

---

## Future Enhancements

Planned improvements:
- [ ] Incremental data updates (delta imports)
- [ ] Cloud backup and restore
- [ ] Multi-device sync
- [ ] Semantic search with vector extension
- [ ] Query result caching
- [ ] Database migrations system (version tracking)

---

**Last Updated:** 2025-12-27
