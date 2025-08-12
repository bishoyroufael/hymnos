import { PGlite, Results } from "@electric-sql/pglite/dist/index.cjs";
import { components, ContentType } from "@db/models";
import {
  get_content_slides,
  get_hymn_using_id,
  get_pack_using_id_paged,
} from "@db/crud/read";
import _, { update } from "lodash";

type HymnView = components["schemas"]["HymnView"];
type PackView = components["schemas"]["PackView"];
type SlideView = components["schemas"]["SlideView"];
type ContentSlidesView = components["schemas"]["ContentSlidesView"];

export async function upsert_slides_safe(
  db: PGlite,
  updated_slides: ContentSlidesView,
) {
  console.log(updated_slides);
  await db.transaction(async (tx) => {
    // Delete all slides and re-insert updated ones for simplicity
    // i.e avoids clashes and constraints errors
    await tx.query(`DELETE FROM slide WHERE content_id = $1;`, [
      updated_slides.content_id,
    ]);

    for (const updated_slide of updated_slides.slides) {
      await tx.query(
        `
        INSERT INTO slide (id, content_id, position)
        VALUES ($1,$2,$3)
        ON CONFLICT(id) DO UPDATE SET
        position=EXCLUDED.position;
        `,
        [
          updated_slide.slide_id,
          updated_slides.content_id,
          updated_slide.position,
        ],
      );

      for (const updated_column of updated_slide.columns) {
        await tx.query(
          `
          INSERT INTO slide_column (id, slide_id, content_type, position, content, header)
          VALUES ($1,$2,$3,$4,$5,$6)
          ON CONFLICT(id) DO UPDATE SET
          position=EXCLUDED.position,
          content=EXCLUDED.content,
          header=EXCLUDED.header;
          `,
          [
            updated_column.id,
            updated_slide.slide_id,
            updated_column.content_type,
            updated_column.position,
            updated_column.content,
            updated_column.header,
          ],
        );
      }
    }
  });

  return await get_content_slides(db, updated_slides.content_id);
}

export async function upsert_hymn_safe(db: PGlite, updated_hymn: HymnView) {
  await db.transaction(async (tx) => {
    const old_hymn = await get_hymn_using_id(tx, updated_hymn.id);

    // Insert Content Safe
    await tx.query(
      `
      INSERT INTO content (id, type)
      VALUES ($1, $2)
      ON CONFLICT(id) DO NOTHING;`,
      [updated_hymn.id, ContentType.hymn],
    );
    await tx.query(
      `
        INSERT INTO hymn (id, name, author, composer)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT(id) DO UPDATE SET
        name=EXCLUDED.name,
        author=EXCLUDED.author,
        composer=EXCLUDED.composer;
        `,
      [
        updated_hymn.id,
        updated_hymn.name,
        updated_hymn.author,
        updated_hymn.composer,
      ],
    );
    if (old_hymn && !_.isEqual(old_hymn.slides, updated_hymn.slides)) {
      // Delete all slides and re-insert updated ones for simplicity
      // i.e avoids clashes and constraints errors
      await tx.query(`DELETE FROM slide WHERE content_id = $1;`, [
        updated_hymn.id,
      ]);

      // Update Slides and Slides Columns respectively
      for (const slideView of updated_hymn.slides) {
        const _slide_insert_id: Results<{ id: string }> = await tx.query(
          `
          INSERT INTO slide (id, content_id, position)
          VALUES ($1,$2,$3)
          RETURNING id;
          `,
          [slideView.slide_id, updated_hymn.id, slideView.position],
        );

        const affectedSlideId = _slide_insert_id.rows[0].id;

        for (const columnView of slideView.columns) {
          // console.log(columnView);
          await tx.query(
            `
              INSERT INTO slide_column (id, slide_id, content_type, position, content, header)
              VALUES ($1,$2,$3,$4,$5,$6);
              `,
            [
              columnView.id,
              affectedSlideId,
              columnView.content_type,
              columnView.position,
              columnView.content,
              columnView.header,
            ],
          );
        }
      }
    }
  });

  return await get_hymn_using_id(db, updated_hymn.id);
}

export async function upset_pack_safe(db: PGlite, updated_pack: PackView) {
  await db.transaction(async (tx) => {
    const old_pack = await get_pack_using_id_paged(
      tx,
      updated_pack.id,
      updated_pack?.pagination?.current_page || 0,
    );
    await tx.query(
      `
        INSERT INTO pack (id, name, author, description)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT(id) DO UPDATE SET
        name=EXCLUDED.name,
        author=EXCLUDED.author,
        description=EXCLUDED.description;
        `,
      [
        updated_pack.id,
        updated_pack.name,
        updated_pack.author,
        updated_pack.description,
      ],
    );

    if (old_pack && !_.isEqual(old_pack.items, updated_pack.items)) {
      const deleted_items = _.differenceBy(
        old_pack.items,
        updated_pack.items,
        "id",
      );

      // Delete items if user removed some
      await tx.query(
        `DELETE FROM pack_item WHERE content_id = ANY($1) AND pack_id = $2;`,
        [deleted_items.map((i) => i.id), updated_pack.id],
      );

      for (const item of updated_pack.items) {
        await tx.query(
          `
              INSERT INTO pack_item (pack_id, content_id)
              VALUES ($1,$2)
              ON CONFLICT(pack_id, content_id) DO UPDATE SET
              pack_id = EXCLUDED.pack_id,
              content_id = EXCLUDED.content_id;
              `,
          [updated_pack.id, item.id],
        );
      }
    }
  });

  return await get_pack_using_id_paged(
    db,
    updated_pack.id,
    updated_pack?.pagination?.current_page || 0,
  );
}
