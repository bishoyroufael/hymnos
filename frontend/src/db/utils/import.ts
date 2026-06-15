import type { PGliteWithLive } from "@electric-sql/pglite/live";
import JSZip from "jszip";

/**
 * Import tables from a zip file containing CSV exports
 * @param db PGlite database instance
 * @param file Zip file (Blob or File) containing CSV table exports
 * @param should_direct_copy If true, directly copy to tables. If false, use temp tables and merge.
 */
export async function import_tables_from_zip(db: PGliteWithLive, file: File | Blob, should_direct_copy: boolean = false) {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  // Disable foreign key constraints during import
  await db.exec("SET session_replication_role = 'replica';");

  try {
    // Import each CSV file from the zip
    for (const fileName of Object.keys(zipContent.files)) {
      const blob = await zipContent.files[fileName].async("blob");
      const split = fileName.split(".");
      const tableName = split[0];
      const ext = split[1];
      if (ext != "csv") continue;

      if (should_direct_copy) {
        // Copy directly to table from CSV file
        await db.query(`COPY ${tableName} FROM '/dev/blob' WITH (FORMAT csv, HEADER);`, [], { blob });
      } else {
        // Create temp table -> copy to temp -> merge -> remove temp
        await db.exec(`CREATE TABLE IF NOT EXISTS ${tableName}_import (LIKE ${tableName});`);

        await db.query(`COPY ${tableName}_import FROM '/dev/blob' WITH (FORMAT csv, HEADER);`, [], { blob });

        await db.query(`
          INSERT INTO ${tableName} (
            SELECT * FROM ${tableName}_import
          )
          ON CONFLICT DO NOTHING;
        `);

        await db.exec(`TRUNCATE ${tableName}_import;`);
      }
    }
  } finally {
    // Re-enable foreign key constraints
    await db.exec("SET session_replication_role = 'origin';");
  }
}

/**
 * Import initial data from bundled assets
 * @param db PGlite database instance
 */
export async function importInitialData(db: PGliteWithLive) {
  console.log("Importing hymns data...");
  const hymnsResponse = await fetch("/assets/hymns_pglite_import.zip");
  const hymnsBlob = await hymnsResponse.blob();
  await import_tables_from_zip(db, hymnsBlob, true);

  console.log("Importing bibles data...");
  const biblesResponse = await fetch("/assets/bibles_pglite_import.zip");
  const biblesBlob = await biblesResponse.blob();
  await import_tables_from_zip(db, biblesBlob, true);

  console.log("✓ Initial data import complete");
}
