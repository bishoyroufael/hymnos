// Reset helpers: wipe the local PGlite database from the browser so the next load
// re-initializes the schema + seed data from scratch. Kept framework-agnostic and
// modular so it can be triggered from anywhere (settings, error screens, …).

function deleteIndexedDb(name: string): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    // If a connection is still open the delete is blocked; resolve anyway — the
    // page reload that follows drops the connection so the delete completes then.
    req.onblocked = () => resolve();
  });
}

/**
 * Delete the PGlite IndexedDB store(s) for this origin. Enumerates databases where
 * supported (Chromium, Safari) and also tries known names as a fallback (Firefox has
 * no indexedDB.databases()). The only IndexedDB this app uses is PGlite's.
 */
export async function deleteLocalDatabase(): Promise<void> {
  const names = new Set<string>();

  if (typeof indexedDB.databases === "function") {
    try {
      for (const d of await indexedDB.databases()) {
        if (d.name && (d.name.includes("hymnos") || d.name.includes("pglite"))) names.add(d.name);
      }
    } catch {
      /* enumeration unsupported/blocked — fall back to known names below */
    }
  }
  // PGlite (Emscripten IDBFS) names the store after the `idb://hymnos-pgdata` dataDir.
  ["hymnos-pgdata", "/hymnos-pgdata", "/pglite/hymnos-pgdata"].forEach((n) => names.add(n));

  await Promise.all([...names].map(deleteIndexedDb));
}

/**
 * Wipe the local database and reload so everything re-initializes from scratch.
 * Pass the live PGlite instance to close it first (avoids a blocked delete).
 */
export async function resetLocalDatabase(db?: { close?: () => Promise<void> }): Promise<void> {
  try {
    await db?.close?.();
  } catch {
    /* already closed / closing failed — proceed to delete anyway */
  }
  await deleteLocalDatabase();
  window.location.reload();
}
