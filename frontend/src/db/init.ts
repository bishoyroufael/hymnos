import { live, type PGliteWithLive } from "@electric-sql/pglite/live";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { SQL_INITIAL_MIGRATIONS, SQL_CREATE_VIEWS_FUNCTIONS } from "./commands/migrations";
import { SQL_INDICES } from "./commands/indices";
import { SQL_INSERT_DIACRITIC_MAP } from "./commands/diacritic";
import { SQL_REMOVE_DIACRITICS } from "./commands/functions/remove_diacritics";
import { importInitialData } from "./utils/import";
import { PGlite } from "@electric-sql/pglite";

/**
 * Check if database is empty (no tables)
 */
async function checkIfDatabaseEmpty(pg: PGliteWithLive): Promise<boolean> {
  try {
    const result = await pg.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `);

    const tableCount = parseInt((result.rows[0] as any)?.table_count || "0");
    return tableCount === 0;
  } catch {
    return true;
  }
}

/**
 * Run database migrations and import initial data
 * Order matches the original frontend's _import_from_assets function:
 * 1. Create tables and enums
 * 2. Initialize diacritic handling
 * 3. Import data (BEFORE views/indices for optimization)
 * 4. Create views and functions
 * 5. Create indices (on already-populated tables)
 */
async function runMigrationsAndImport(pg: PGliteWithLive) {
  console.log("Running database migrations and import...");

  try {
    // Step 1: Create tables and enums
    console.log("Creating tables...");
    await pg.exec(SQL_INITIAL_MIGRATIONS);

    // Step 2: Initialize diacritic handling
    console.log("Setting up diacritic handling...");
    await pg.exec(SQL_INSERT_DIACRITIC_MAP);
    await pg.exec(SQL_REMOVE_DIACRITICS);

    // Step 3: Import data (BEFORE views/indices for optimization)
    console.log("Importing initial data...");
    await importInitialData(pg);

    // Step 4: Create views and functions
    console.log("Creating views and functions...");
    await pg.exec(SQL_CREATE_VIEWS_FUNCTIONS);

    // Step 5: Create indices (on already-populated tables)
    console.log("Creating indices...");
    await pg.exec(SQL_INDICES);

    console.log("✓ All migrations and import complete");
  } catch (error) {
    console.error("Migration/import failed:", error);
    throw error;
  }
}

/**
 * Create and initialize the PGlite database instance
 * This function is called once at app startup
 * Returns a PGlite instance with live queries extension for pglite-react
 */
export async function createPGliteInstance() {
  console.log("Initializing PGlite database...");

  // Initialize PGlite with extensions and IndexedDB persistence
  const db = await PGlite.create({
    dataDir: "idb://hymnos-pgdata",
    extensions: {
      live, // Required for pglite-react
      pg_trgm, // Trigram similarity for text search
    },
    relaxedDurability: true, // Better performance, acceptable for client-side
  });

  // Configure PGlite extensions and performance settings
  console.log("Configuring database extensions...");
  await db.exec(`
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    SET work_mem TO '16MB';
    SET pg_trgm.similarity_threshold = 0.4;
    SET maintenance_work_mem TO '128MB';
  `);

  // Check if database needs initialization
  const needsMigration = await checkIfDatabaseEmpty(db);

  if (needsMigration) {
    await runMigrationsAndImport(db);
  }

  console.log("✓ Database ready");
  return db;
}
