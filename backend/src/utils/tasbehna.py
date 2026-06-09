import sqlite3
from pathlib import Path
from uuid import uuid7
from datetime import datetime
from models.openapi import *
from .languages import get_arabic_language_id, get_all_languages

def convert_tasbe7na_to_hymnos(db_path: str) -> Tables:
    """
    Convert Tasbe7na SQLite database to Hymnos Tables model.

    Mapping:
    - Each song -> Content (type=hymn) + Hymn
    - Each Tasbe7na slide -> Hymnos Slide
    - All segments in a slide -> joined into SlideRow.content
    - Verse numbering: Arabic numerals for verses (type=0), (ق) for chorus (type=1)
    - Author/Composer: from song_authors and song_composers tables
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Arabic numerals for verse numbering
    arabic_numerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

    def to_arabic_number(num: int) -> str:
        """Convert integer to Arabic numeral string."""
        return ''.join(arabic_numerals[int(d)] for d in str(num))

    all_tables = Tables(
        content=[],
        hymn=[],
        slide=[],
        slide_row=[],
        slide_column=[],
        slide_block=[],
        language=get_all_languages()
    )

    # Fetch all songs
    songs_query = """
        SELECT s.id, s.item_id, s.title
        FROM songs s
        ORDER BY s.id
    """
    songs = cursor.execute(songs_query).fetchall()

    for song in songs:
        song_id = song['id']
        song_item_id = song['item_id']
        song_title = song['title']

        # Create Content and Hymn
        hymn_content = Content(id=str(uuid7()), type=ContentType.hymn)

        # Get authors (join multiple with commas)
        authors_query = """
            SELECT a.ar_name
            FROM song_authors sa
            JOIN authors a ON a.id = sa.author
            WHERE sa.song = ?
        """
        authors = cursor.execute(authors_query, (song_id,)).fetchall()
        author_str = ', '.join([a['ar_name'] for a in authors]) if authors else None
        author_str = None if author_str == 'مجهول' else author_str

        # Get composers (join multiple with commas)
        composers_query = """
            SELECT c.ar_name
            FROM song_composers sc
            JOIN composers c ON c.id = sc.composer
            WHERE sc.song = ?
        """
        composers = cursor.execute(composers_query, (song_id,)).fetchall()
        composer_str = ', '.join([c['ar_name'] for c in composers]) if composers else None
        composer_str = None if composer_str == 'مجهول' else composer_str

        hymn_obj = Hymn(
            id=hymn_content.id,
            name=song_title,
            author=author_str,
            composer=composer_str
        )

        all_tables.content.append(hymn_content)
        all_tables.hymn.append(hymn_obj)

        # Get verses for this song, ordered by id
        verses_query = """
            SELECT v.id, v.type
            FROM verses v
            WHERE v.item_id = ?
            ORDER BY v.id
        """
        verses = cursor.execute(verses_query, (song_item_id,)).fetchall()

        # Track verse numbers (only for type=0 verses)
        verse_number = 1
        slide_position = 0

        for verse in verses:
            verse_id = verse['id']
            verse_type = verse['type']

            # Get slides for this verse, ordered by id
            slides_query = """
                SELECT sl.id, sl.heading
                FROM slides sl
                WHERE sl.verse = ?
                ORDER BY sl.id
            """
            slides = cursor.execute(slides_query, (verse_id,)).fetchall()

            # Determine header for first slide of this verse
            is_first_slide_in_verse = True

            for slide in slides:
                slide_id_db = slide['id']

                # Create Hymnos Slide
                hymn_slide = Slide(
                    id=str(uuid7()),
                    content_id=hymn_content.id,
                    position=slide_position
                )
                slide_position += 1

                # Get segments for this slide
                segments_query = """
                    SELECT seg.content
                    FROM segments seg
                    WHERE seg.slide = ?
                    ORDER BY seg.id
                """
                segments = cursor.execute(segments_query, (slide_id_db,)).fetchall()

                # Join all segment content with newlines
                content = '\n'.join([seg['content'] for seg in segments])

                # Determine header
                header = None
                if is_first_slide_in_verse:
                    if verse_type == 1:  # Chorus
                        header = "(ق)"
                    elif verse_type == 0:  # Regular verse
                        header = f"({to_arabic_number(verse_number)})"
                    is_first_slide_in_verse = False

                # Create SlideRow (horizontal row with 1 column)
                slide_row = SlideRow(
                    id=str(uuid7()),
                    slide_id=hymn_slide.id,
                    position=0,
                    columns=1
                )

                # Create SlideColumn (container for blocks)
                slide_column = SlideColumn(
                    id=str(uuid7()),
                    row_id=slide_row.id,
                    position=0,
                    language_id=str(get_arabic_language_id())
                )

                # Create SlideBlocks for header and content
                block_position = 0
                if header:
                    # Add header block (verse number or chorus marker)
                    header_block = SlideBlock(
                        id=str(uuid7()),
                        column_id=slide_column.id,
                        content_type=ContentType.hymn,
                        position=block_position,
                        content=header,
                        metadata=BlockStyle(type=BlockType.h3, align=BlockAlign.center_)
                    )
                    all_tables.slide_block.append(header_block)
                    block_position += 1

                # Add content block (main text)
                content_block = SlideBlock(
                    id=str(uuid7()),
                    column_id=slide_column.id,
                    content_type=ContentType.hymn,
                    position=block_position,
                    content=content,
                    metadata=BlockStyle(type=BlockType.paragraph, align=BlockAlign.center_)
                )

                all_tables.slide.append(hymn_slide)
                all_tables.slide_row.append(slide_row)
                all_tables.slide_column.append(slide_column)
                all_tables.slide_block.append(content_block)

            # Increment verse number only for non-chorus verses
            if verse_type == 0:
                verse_number += 1

    conn.close()

    # Create Pack for all hymns
    hymn_pack = Pack(
        id=str(uuid7()),
        name="ترانيم تسبيحنا",
        author="موقع تسبيحنا",
        description="تشكيلة من الترانيم العربية - موقع تسبيحنا"
    )
    hymn_pack_items = [PackItem(pack_id=hymn_pack.id, content_id=c.id) for c in all_tables.content]
    all_tables.pack = [hymn_pack]
    all_tables.pack_item = hymn_pack_items

    return all_tables


# Main function to download, check, and extract the file
def get_tasbe7na_sqlite_db(force_download: bool = False) -> Path:
    """
    Download the Tasbe7na SQLite database to a temp folder.

    Args:
        force_download: If True, re-download even if cached file exists

    Returns:
        Path to the downloaded database file
    """
    import requests
    import tempfile

    # Create temp directory for Tasbe7na data
    temp_dir = Path(tempfile.gettempdir()) / "hymnos_tasbe7na"
    temp_dir.mkdir(exist_ok=True)

    # Check for existing cached database
    cached_files = list(temp_dir.glob("tasbe7na_*.db"))

    if cached_files and not force_download:
        # Use most recent cached file
        cached_file = max(cached_files, key=lambda p: p.stat().st_mtime)
        print(f"Using cached database: {cached_file}")
        print(f"Database size: {cached_file.stat().st_size} bytes")
        print(f"Last modified: {datetime.fromtimestamp(cached_file.stat().st_mtime)}")
        print(f"(Use force_download=True to re-download)")
        return cached_file

    print("Downloading fresh database from Tasbe7na...")

    # Step 1: Fetch the secret
    secret_url = "https://tasbe7na.com/get-secret"
    print(f"Fetching secret from {secret_url}...")
    secret_response = requests.get(secret_url, timeout=10)
    secret_response.raise_for_status()
    secret = secret_response.text.strip()
    print(f"Secret obtained: {secret[:10]}..." if len(secret) > 10 else f"Secret obtained: {secret}")

    # Step 2: Download the SQLite database with the secret header
    db_url = "https://tasbe7na.com/get-database"
    headers = {
        "X-Db-Secret": secret
    }
    print(f"Downloading database from {db_url}...")
    db_response = requests.get(db_url, headers=headers, timeout=30)
    db_response.raise_for_status()

    # Step 3: Save the database file to temp directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    db_file_path = temp_dir / f"tasbe7na_{timestamp}.db"

    with open(db_file_path, 'wb') as f:
        f.write(db_response.content)

    print(f"Database saved to: {db_file_path}")
    print(f"Database size: {len(db_response.content)} bytes")

    # Clean up old cached files (keep only the 3 most recent)
    all_cached = sorted(temp_dir.glob("tasbe7na_*.db"), key=lambda p: p.stat().st_mtime, reverse=True)
    for old_file in all_cached[3:]:
        print(f"Removing old cached file: {old_file}")
        old_file.unlink()

    return db_file_path