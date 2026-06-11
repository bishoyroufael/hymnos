"""
Utilities for converting One Coptic Library database to Hymnos liturgy format
"""
import sqlite3
from uuid import uuid4
from typing import Dict, List, Tuple
from Crypto.Cipher import AES
import binascii
from models.openapi import (
    Tables,
    Content,
    LiturgyTranslation,
    LiturgyBook,
    LiturgySection,
    LiturgyBookSection,
    LiturgySubsection,
    Slide,
    SlideRow,
)


# Decryption constants
AES_KEY = b'99df848b77e8888c2db8d3af3558d022'
AES_IV = b'ch.gemail21@goog'  # First 16 bytes


def decrypt_text(ciphertext_hex: str) -> str:
    """
    Decrypt encrypted text from One Coptic Library database

    Args:
        ciphertext_hex: Hexadecimal string of encrypted text

    Returns:
        Decrypted text
    """
    try:
        ciphertext = binascii.unhexlify(ciphertext_hex)
        cipher = AES.new(AES_KEY, AES.MODE_CBC, AES_IV)
        decrypted = cipher.decrypt(ciphertext)
        # Remove PKCS7 padding
        padding_length = decrypted[-1]
        decrypted = decrypted[:-padding_length]
        return decrypted.decode('utf-8', errors='ignore').strip()
    except Exception as e:
        print(f"[warning] Failed to decrypt text: {e}")
        return ""


def get_language_mapping() -> Dict[str, Tuple[str, str, str]]:
    """
    Map One Coptic Library language columns to Hymnos translation IDs

    Returns:
        Dict mapping column name to (translation_id, language_code, variant_name)
    """
    return {
        'coptic': ('cop-bohairic', 'cop', 'Bohairic'),
        'arabic': ('ara-standard', 'ara', 'Standard'),
        'english': ('eng-contemporary', 'eng', 'Contemporary'),
    }


def convert_one_coptic_library_to_hymnos(db_path: str, book_id: int = 29) -> Tables:
    """
    Convert One Coptic Library Agpeya database to Hymnos liturgy format

    Args:
        db_path: Path to One Coptic Library SQLite database
        book_id: Book ID to extract (default 29 = Agpeya)

    Returns:
        Tables object containing all liturgy data
    """
    print(f"[liturgy-convert] Opening database: {db_path}")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Initialize data structures
    content_list: List[Content] = []
    liturgy_translations: List[LiturgyTranslation] = []
    liturgy_books: List[LiturgyBook] = []
    liturgy_sections: List[LiturgySection] = []
    liturgy_book_sections: List[LiturgyBookSection] = []
    liturgy_subsections: List[LiturgySubsection] = []
    slides: List[Slide] = []
    slide_rows: List[SlideRow] = []

    # Get language mapping
    lang_map = get_language_mapping()

    # Create translations
    print("[liturgy-convert] Creating translations...")
    for lang_column, (trans_id, lang_code, variant) in lang_map.items():
        liturgy_translations.append(LiturgyTranslation(
            id=trans_id,
            language_code=lang_code,
            variant=variant.lower(),
            name=f"{variant}" if lang_code != 'cop' else f"Coptic ({variant})",
            is_rtl=True if lang_code == 'ara' else False
        ))

    # Get book information
    print(f"[liturgy-convert] Fetching book {book_id} information...")
    book_row = cursor.execute(
        "SELECT * FROM book WHERE id = ?",
        (book_id,)
    ).fetchone()

    if not book_row:
        raise ValueError(f"Book with id {book_id} not found")

    # Create one liturgy book per language
    book_map: Dict[str, uuid4] = {}  # translation_id -> book UUID
    for lang_column, (trans_id, _, _) in lang_map.items():
        book_name = book_row[lang_column] if book_row[lang_column] else "Agpeya"
        desc_column = f"description_{lang_column}"
        book_desc = book_row[desc_column] if desc_column in book_row.keys() and book_row[desc_column] else None

        book_uuid = uuid7()
        book_map[trans_id] = book_uuid

        content_list.append(Content(
            id=book_uuid,
            type='liturgy_book'
        ))

        liturgy_books.append(LiturgyBook(
            id=book_uuid,
            translation_id=trans_id,
            name=book_name,
            author=None,
            description=book_desc,
            is_official=True,
            created_by=None
        ))

    # Get all sections and subsections used in this book
    print("[liturgy-convert] Fetching sections and subsections...")
    sections_query = """
        SELECT DISTINCT section, subsection
        FROM book_contents
        WHERE book_id = ?
        ORDER BY section, subsection
    """
    sections_data = cursor.execute(sections_query, (book_id,)).fetchall()

    # Create section and subsection mappings
    # section_map: (section_id, translation_id) -> UUID
    section_map: Dict[Tuple[int, str], uuid4] = {}
    # subsection_map: (section_id, subsection_id, translation_id) -> UUID
    subsection_map: Dict[Tuple[int, int, str], uuid4] = {}

    # Group by section
    sections_by_id: Dict[int, List[int]] = {}
    for row in sections_data:
        section_id = row['section']
        subsection_id = row['subsection']

        if section_id not in sections_by_id:
            sections_by_id[section_id] = []
        if subsection_id not in sections_by_id[section_id]:
            sections_by_id[section_id].append(subsection_id)

    # Create sections (one per language)
    print("[liturgy-convert] Creating sections...")
    # Track section position per book/language
    section_positions: Dict[str, int] = {trans_id: 1 for _, (trans_id, _, _) in lang_map.items()}

    for section_id in sorted(sections_by_id.keys()):
        # Get section metadata
        section_info = cursor.execute(
            "SELECT * FROM section WHERE id = ?",
            (section_id,)
        ).fetchone()

        if not section_info:
            print(f"[warning] Section {section_id} not found in section table, skipping")
            continue

        # Create one section per language
        for lang_column, (trans_id, _, _) in lang_map.items():
            section_name = section_info[lang_column] if section_info[lang_column] else f"Section {section_id}"

            # Create section UUID and content
            section_uuid = uuid7()
            section_map[(section_id, trans_id)] = section_uuid

            content_list.append(Content(
                id=section_uuid,
                type='liturgy_section'
            ))

            liturgy_sections.append(LiturgySection(
                id=section_uuid,
                translation_id=trans_id,
                name=section_name,
                description=None,
                created_by=None
            ))

            # Link section to book with position specific to this language's book
            liturgy_book_sections.append(LiturgyBookSection(
                liturgy_book_id=book_map[trans_id],
                section_id=section_uuid,
                position=section_positions[trans_id]
            ))

            # Increment position for this language's book
            section_positions[trans_id] += 1

        # Create subsections for this section (one per language)
        print(f"[liturgy-convert] Creating subsections for section {section_id}...")
        subsection_position = 1
        for subsection_id in sorted(sections_by_id[section_id]):
            # Get subsection metadata
            subsection_info = cursor.execute(
                "SELECT * FROM subsection WHERE id = ?",
                (subsection_id,)
            ).fetchone()

            # Create one subsection per language
            for lang_column, (trans_id, _, _) in lang_map.items():
                subsection_name = ""
                if subsection_info and subsection_info[lang_column]:
                    subsection_name = subsection_info[lang_column]
                else:
                    subsection_name = f"Subsection {subsection_id}" if subsection_id and subsection_id > 0 else "Main Content"

                # Create subsection UUID and content
                subsection_uuid = uuid7()
                subsection_map[(section_id, subsection_id, trans_id)] = subsection_uuid

                content_list.append(Content(
                    id=subsection_uuid,
                    type='liturgy_subsection'
                ))

                liturgy_subsections.append(LiturgySubsection(
                    id=subsection_uuid,
                    section_id=section_map[(section_id, trans_id)],
                    translation_id=trans_id,
                    position=subsection_position,
                    name=subsection_name,
                    description=None,
                    rubric=None,
                    created_by=None
                ))

            subsection_position += 1

    # Fetch and create slides
    print("[liturgy-convert] Creating slides and slide rows...")
    contents_query = """
        SELECT bc.*, r.*
        FROM book_contents bc
        JOIN responses r ON bc.response_id = r.response_id
        WHERE bc.book_id = ?
        ORDER BY bc.section, bc.subsection, bc.line_id
    """

    contents_data = cursor.execute(contents_query, (book_id,)).fetchall()

    # Track slide positions per subsection per language
    slide_positions: Dict[Tuple[int, int, str], int] = {}

    for content_row in contents_data:
        section_id = content_row['section']
        subsection_id = content_row['subsection']

        # Create slides for each language separately
        for lang_column, (trans_id, _, _) in lang_map.items():
            subsection_key = (section_id, subsection_id, trans_id)

            if subsection_key not in subsection_map:
                print(f"[warning] Subsection {subsection_key} not found in map, skipping")
                continue

            subsection_uuid = subsection_map[subsection_key]

            # Get current slide position for this subsection+language
            if subsection_key not in slide_positions:
                slide_positions[subsection_key] = 1

            # Only create slide if this language has content
            encrypted_text = content_row[lang_column]
            if encrypted_text:
                decrypted_text = decrypt_text(encrypted_text)
                if decrypted_text:
                    # Create slide
                    slide_uuid = uuid7()
                    slides.append(Slide(
                        id=slide_uuid,
                        content_id=subsection_uuid,
                        position=slide_positions[subsection_key]
                    ))

                    # Create single slide row for this language
                    slide_rows.append(SlideRow(
                        id=uuid7(),
                        slide_id=slide_uuid,
                        content_type='liturgy_subsection',
                        position=1,
                        content=decrypted_text,
                        header=None
                    ))

                    slide_positions[subsection_key] += 1

    conn.close()

    print(f"[liturgy-convert] Conversion complete!")
    print(f"  - {len(liturgy_translations)} translations")
    print(f"  - {len(liturgy_books)} books")
    print(f"  - {len(liturgy_sections)} sections")
    print(f"  - {len(liturgy_subsections)} subsections")
    print(f"  - {len(slides)} slides")
    print(f"  - {len(slide_rows)} slide rows")

    return Tables(
        content=content_list,
        liturgy_translation=liturgy_translations,
        liturgy_book=liturgy_books,
        liturgy_section=liturgy_sections,
        liturgy_book_section=liturgy_book_sections,
        liturgy_subsection=liturgy_subsections,
        slide=slides,
        slide_row=slide_rows
    )
