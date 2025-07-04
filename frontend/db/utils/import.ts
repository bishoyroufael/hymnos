import { PGlite } from "@electric-sql/pglite/dist/index.cjs";
import JSZip from "jszip";
import * as DocumentPicker from "expo-document-picker";
import { emitError, emitInfo } from "@utils/notification";
import { HymnosState } from "global.interfaces";

/**
 *
 * @param data data from an export to import to the database
 */
async function import_blobs_from_file(db: PGlite, file: File) {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  console.log(Object.keys(zipContent.files));

  // Loop through the files in the zip
  // filename is the table name in our database
  for (const fileName of Object.keys(zipContent.files)) {
    const zipEntry = zipContent.files[fileName];
    const tableName = fileName.split(".")[0];
    if (!zipEntry.dir) {
      const blob = await zipEntry.async("blob");

      // Create temp import table with the same schema
      // as the original table
      await db.exec(
        `CREATE TABLE IF NOT EXISTS ${tableName}_import (LIKE ${tableName});`,
      );

      // Copy to temporary import table
      await db.query(
        `COPY ${tableName}_import FROM '/dev/blob' WITH (FORMAT csv, HEADER);`,
        [],
        {
          blob: blob,
        },
      );
      // Merge to real table
      await db.query(
        `INSERT INTO ${tableName} (
          SELECT * FROM ${tableName}_import
        )
        ON CONFLICT DO NOTHING;`,
      );
      // (cleanup) Truncate import table
      await db.query(`TRUNCATE ${tableName}_import;`);
    }
  }
}

export const handleImportUserData = async (
  db: PGlite,
  set: (partial: Partial<HymnosState>) => void,
) => {
  set({ importUserDataStatus: "inprogress" });
  try {
    const doc = await DocumentPicker.getDocumentAsync({
      type: "application/zip",
    });

    if (doc && doc.assets && doc.assets.length > 0) {
      const file = doc.assets[0].file;

      await import_blobs_from_file(db, file);

      emitInfo("تم اضافه المعلومات بنجاح!");
    }
  } catch (e) {
    emitError("Error occurred while importing: " + e);
  } finally {
    set({ importUserDataStatus: "done" });
  }
};
