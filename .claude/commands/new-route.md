# Add a new route/screen to Hymnos

You are helping add a new page to the Hymnos frontend. This is a 2-step checklist. Complete both steps and verify the route renders before marking done.

## Context

- Router: `react-router-dom` (`createBrowserRouter`), configured in `frontend/src/router.tsx`.
- Two layout hierarchies: `RootLayout` (header + footer, `w-10/12 mx-auto`) for all normal pages; `PresentationLayout` (fullscreen) for `/presentation/*` only.
- All text in the app is Arabic; use `dir="rtl"` on the root container of every page.
- Database access: `usePGlite()` from `@electric-sql/pglite-react`.
- Styling: Tailwind CSS via NativeWind; DaisyUI component classes (`btn`, `card`, `alert`, `loading`, `modal`).

---

## Step 1 — Create the route file

### File location

| Route type | File path |
|---|---|
| View page (shows one item) | `frontend/src/routes/<entity>/[uuid].tsx` |
| Create page (form for new item) | `frontend/src/routes/<entity>/create.tsx` |
| List/index page | `frontend/src/routes/<entity>/index.tsx` |

---

### View page template (`[uuid].tsx`)

```typescript
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePGlite } from "@electric-sql/pglite-react";
import type { components } from "@/db/models";
import { get<Entity>ById } from "@/db/crud/read/<entity>";

type <Entity>View = components["schemas"]["<Entity>View"];

export default function <Entity>ViewPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const db = usePGlite();
  const navigate = useNavigate();

  const [item, setItem] = useState<<Entity>View | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    if (!db || !uuid) return;
    const result = await get<Entity>ById(db, uuid);
    if (result) setItem(result);
  };

  useEffect(() => {
    if (!db || !uuid) return;
    setLoading(true);
    get<Entity>ById(db, uuid)
      .then((result) => {
        if (!result) setError("لم يتم العثور على العنصر");
        else setItem(result);
      })
      .catch(() => setError("حدث خطأ أثناء التحميل"))
      .finally(() => setLoading(false));
  }, [db, uuid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-8 max-w-2xl mx-auto" dir="rtl">
        <div className="alert alert-error"><span>{error ?? "لم يتم العثور على العنصر"}</span></div>
        <button className="btn btn-ghost mt-4" onClick={() => navigate(-1)}>العودة</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 max-w-2xl mx-auto" dir="rtl">
      {/* page content */}
    </div>
  );
}
```

---

### Create page template (`create.tsx`)

```typescript
import { useState } from "react";
import { usePGlite } from "@electric-sql/pglite-react";
import { useNavigate } from "react-router-dom";
import { uuidv7 } from "uuidv7";
import { ContentType } from "@/db/models";

export default function <Entity>CreatePage() {
  const db = usePGlite();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !name.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const id = uuidv7();
      await db.transaction(async (tx) => {
        await tx.query("INSERT INTO content (id, type) VALUES ($1, $2)", [id, ContentType.<entity>]);
        await tx.query("INSERT INTO <entity> (id, name) VALUES ($1, $2)", [id, name.trim()]);
      });
      navigate(`/<entity>/${id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "حدث خطأ أثناء الإنشاء");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 max-w-2xl mx-auto" dir="rtl">
      <h1 className="text-3xl lg:text-4xl font-bold">إنشاء عنصر جديد</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body gap-4">
            <input
              className="input input-bordered w-full"
              placeholder="الاسم"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>
        {submitError && <div className="alert alert-error"><span>{submitError}</span></div>}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex gap-4 justify-end">
              <button type="button" className="btn btn-ghost" onClick={() => window.history.back()} disabled={isSubmitting}>إلغاء</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting && <span className="loading loading-spinner loading-sm" />}
                إنشاء
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
```

---

### Key rules for both templates

- Always `dir="rtl"` on the root `<div>`.
- Three render states for view pages: loading spinner → error alert → main content.
- Delete operations must target `content` (not the entity table), because `ON DELETE CASCADE` handles the rest: `DELETE FROM content WHERE id=$1`.
- New entity IDs are always `uuidv7()`.
- Content subtypes need a two-step transaction: insert into `content` first, then into the specific table.
- Use DaisyUI classes for all interactive elements: `btn`, `btn-primary`, `btn-ghost`, `card`, `card-body`, `alert`, `alert-error`, `input`, `input-bordered`, `loading`.

---

## Step 2 — Register the route in `frontend/src/router.tsx`

Import the new page component at the top of the file, then add it inside the correct route group. Normal pages go under `RootLayout`; presentation pages go under `PresentationLayout`.

```typescript
// Import
import <Entity>ViewPage from "@/routes/<entity>/[uuid]";
import <Entity>CreatePage from "@/routes/<entity>/create";

// Inside createBrowserRouter([...]), under the RootLayout children:
{
  path: '<entity>',
  children: [
    { path: 'create', element: <<Entity>CreatePage /> },
    { path: ':uuid',  element: <<Entity>ViewPage /> },
  ],
},
```

---

## Checklist before calling this done

- [ ] Route file created at the correct path with `dir="rtl"` on the root element
- [ ] Three render states implemented for view pages (loading / error / data)
- [ ] Correct layout used (`RootLayout` vs `PresentationLayout`)
- [ ] Route registered in `router.tsx`
- [ ] Dev server running — manually verify the route loads at the expected URL
- [ ] No TypeScript errors (`npx tsc --noEmit` from `frontend/`)
