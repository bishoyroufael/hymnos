# Add a new DB entity to Hymnos

You are helping add a complete new database entity to the Hymnos frontend. This is a 5-step checklist. Work through each step in order, confirming the previous one before moving on.

## Context

- Database: PGlite (PostgreSQL in WASM) — all SQL runs client-side in the browser.
- Types are **auto-generated** from OpenAPI YAML → `frontend/src/db/models.ts`. Never edit `models.ts` by hand.
- Entities that are presentable content follow the **supertype/subtype pattern**: insert into `content` first (with the `content_type` enum value), then into the specific table.

---

## Step 1 — SQL Migration (`frontend/src/db/commands/migrations.ts`)

Add the table(s) inside the `SQL_INITIAL_MIGRATIONS` string constant. Follow these rules:

- UUID primary keys everywhere: `id UUID PRIMARY KEY`
- If this is a content subtype (something with slides), reference `content(id)` and add the value to the `content_type` enum:
  ```sql
  ALTER TYPE content_type ADD VALUE IF NOT EXISTS '<new_type>';
  CREATE TABLE IF NOT EXISTS <entity> (
      id UUID PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      ...
  );
  ```
- If it is NOT a content subtype (a standalone table like `tag`, `language`), define it independently.
- Use `ON DELETE CASCADE` on all FK references to parent tables.
- Use `position INTEGER NOT NULL` + `UNIQUE(parent_id, position)` for any ordered child rows.
- Always wrap nullable text in `TEXT` columns (no VARCHAR lengths).

---

## Step 2 — SQL View (`frontend/src/db/commands/views/<entity>.ts`)

Create a new file exporting a SQL string constant. Then import and add it to `SQL_CREATE_VIEWS_FUNCTIONS` in `migrations.ts`.

Template:
```typescript
export const SQL_<ENTITY>_VIEW = `
CREATE OR REPLACE VIEW view_<entity>_json AS
SELECT
    e.id AS <entity>_id,
    json_build_object(
        '<entity>_id', e.id,
        'name', e.name,
        -- scalar fields first, then nested arrays
        'children', COALESCE(
            (SELECT json_agg(
                json_build_object('child_id', c.id, 'position', c.position)
                ORDER BY c.position
            )
            FROM child_table c WHERE c.<entity>_id = e.id),
            '[]'::json
        )
    ) AS <entity>
FROM <entity> e;
`;
```

Rules:
- Name the view `view_<entity>_json`.
- Name the single returned column after the entity (e.g. `AS hymn`, `AS book`).
- Use `COALESCE(..., '[]'::json)` for every array that might be empty.
- Always `ORDER BY position` inside `json_agg()` for ordered children.
- Join to `content` if the entity is a content subtype.

---

## Step 3 — OpenAPI Schema (source of truth for TypeScript types)

### 3a. Table schema — `backend/openapi/components/schemas/<Entity>.yaml`
```yaml
type: object
description: <One-line description>.
properties:
  id:
    type: string
    format: uuid
  name:
    type: string
  # ... other fields
required:
  - id
  - name
```

### 3b. View schema — `backend/openapi/components/schemas/Views/<Entity>View.yaml`
```yaml
type: object
description: Aggregated view of <entity> with nested data.
properties:
  <entity>_id:
    type: string
    format: uuid
  name:
    type: string
  children:
    type: array
    items:
      $ref: "./<Child>View.yaml"
required:
  - <entity>_id
  - name
  - children
```

### 3c. Register both in `backend/openapi/index.yaml`
Add two entries under `components.schemas`:
```yaml
<Entity>:
  $ref: "./components/schemas/<Entity>.yaml"
<Entity>View:
  $ref: "./components/schemas/Views/<Entity>View.yaml"
```

If the entity adds a new `content_type` enum value, update `backend/openapi/components/schemas/ContentType.yaml` as well.

---

## Step 4 — Regenerate TypeScript models

```bash
cd frontend && npm run generate-db-models
```

This runs `openapi-typescript` and overwrites `src/db/models.ts`. Verify the new types appear under `components["schemas"]`.

---

## Step 5 — CRUD functions

### Read — `frontend/src/db/crud/read/<entity>.ts`
```typescript
import type { components } from "@/db/models";
import type { PGliteWithLive } from "@electric-sql/pglite/live";

type EntityView = components["schemas"]["<Entity>View"];

export async function get<Entity>ById(db: PGliteWithLive, id: string): Promise<<Entity>View | undefined> {
  const results = await db.query("SELECT <entity> FROM view_<entity>_json WHERE <entity>_id=$1;", [id]);
  if (results.rows.length === 0) return undefined;
  return (results.rows[0] as { <entity>: <Entity>View }).<entity>;
}
```

### Write — `frontend/src/db/crud/update/<entity>.ts`
```typescript
import type { PGliteWithLive } from "@electric-sql/pglite/live";

export async function upsert<Entity>(db: PGliteWithLive, ...): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // delete-then-reinsert pattern for upserts
      await tx.query(`DELETE FROM <entity> WHERE id = $1`, [id]);
      await tx.query(`INSERT INTO <entity> (id, name) VALUES ($1, $2)`, [id, name]);
    });
  } catch (error) {
    console.error("Failed to upsert <entity>:", error);
    throw new Error(`Failed to save <entity>: ${error}`);
  }
}
```

For **content subtypes**, the create function must insert into both `content` and the entity table in one transaction:
```typescript
import { uuidv7 } from "uuidv7";
import { ContentType } from "@/db/models";

export async function create<Entity>(db: PGliteWithLive, name: string): Promise<string> {
  const id = uuidv7();
  await db.transaction(async (tx) => {
    await tx.query("INSERT INTO content (id, type) VALUES ($1, $2)", [id, ContentType.<entity>]);
    await tx.query("INSERT INTO <entity> (id, name) VALUES ($1, $2)", [id, name]);
  });
  return id;
}
```

---

## Checklist before calling this done

- [ ] Migration SQL added to `SQL_INITIAL_MIGRATIONS` in `migrations.ts`
- [ ] View SQL added in `db/commands/views/<entity>.ts` and wired into `SQL_CREATE_VIEWS_FUNCTIONS`
- [ ] OpenAPI YAML files created (table + view) and registered in `index.yaml`
- [ ] `npm run generate-db-models` run successfully
- [ ] New types visible in `models.ts` (do not edit manually)
- [ ] CRUD read function in `db/crud/read/<entity>.ts`
- [ ] CRUD write function in `db/crud/update/<entity>.ts`
- [ ] If content subtype: `content_type` enum value added in both SQL and `ContentType.yaml`
