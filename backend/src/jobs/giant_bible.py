# this file is responsible for extracting bible from the 
# the Giant Bible Project SQLite database: https://nnty.fun/downloads/other/giant_bible_db_v1_0_0_4chad/

from typing import List
import sqlite3

from models.openapi import *
import uuid
from tqdm import tqdm

ALLOWED_TRANSLATIONS = [
    BibleTranslation(id="arb-vd", name="الكتاب المقدس باللغة العربية، فان دايك", abbr="ف.د."),
    BibleTranslation(id="arbwbtc",name="الكتاب المقدس باللغة العربية - الترجمة المبسطة", abbr=".ت.ع.م"),
    BibleTranslation(id="eng-kjv", name="King James Version", abbr="KJV")
    ]

BOOKS_FULL_NAME_MAP = {
    "GEN": {"English": "Genesis", "Arabic": "التكوين"},
    "EXO": {"English": "Exodus", "Arabic": "الخروج"},
    "LEV": {"English": "Leviticus", "Arabic": "اللاويين"},
    "NUM": {"English": "Numbers", "Arabic": "العدد"},
    "DEU": {"English": "Deuteronomy", "Arabic": "التثنية"},
    "JOS": {"English": "Joshua", "Arabic": "يشوع"},
    "JDG": {"English": "Judges", "Arabic": "القضاة"},
    "RUT": {"English": "Ruth", "Arabic": "راعوث"},
    "1SA": {"English": "1 Samuel", "Arabic": "صموئيل الأول"},
    "2SA": {"English": "2 Samuel", "Arabic": "صموئيل الثاني"},
    "1KI": {"English": "1 Kings", "Arabic": "الملوك الأول"},
    "2KI": {"English": "2 Kings", "Arabic": "الملوك الثاني"},
    "1CH": {"English": "1 Chronicles", "Arabic": "أخبار الأيام الأول"},
    "2CH": {"English": "2 Chronicles", "Arabic": "أخبار الأيام الثاني"},
    "EZR": {"English": "Ezra", "Arabic": "عزرا"},
    "NEH": {"English": "Nehemiah", "Arabic": "نحميا"},
    "EST": {"English": "Esther", "Arabic": "أستير"},
    "JOB": {"English": "Job", "Arabic": "أيوب"},
    "PSA": {"English": "Psalms", "Arabic": "المزامير"},
    "PRO": {"English": "Proverbs", "Arabic": "الأمثال"},
    "ECC": {"English": "Ecclesiastes", "Arabic": "الجامعة"},
    "SNG": {"English": "Song of Solomon", "Arabic": "نشيد الأنشاد"},
    "ISA": {"English": "Isaiah", "Arabic": "إشعياء"},
    "JER": {"English": "Jeremiah", "Arabic": "إرميا"},
    "LAM": {"English": "Lamentations", "Arabic": "مراثي إرميا"},
    "EZK": {"English": "Ezekiel", "Arabic": "حزقيال"},
    "DAN": {"English": "Daniel", "Arabic": "دانيال"},
    "HOS": {"English": "Hosea", "Arabic": "هوشع"},
    "JOL": {"English": "Joel", "Arabic": "يوئيل"},
    "AMO": {"English": "Amos", "Arabic": "عاموس"},
    "OBA": {"English": "Obadiah", "Arabic": "عوبديا"},
    "JON": {"English": "Jonah", "Arabic": "يونان"},
    "MIC": {"English": "Micah", "Arabic": "ميخا"},
    "NAM": {"English": "Nahum", "Arabic": "ناحوم"},
    "HAB": {"English": "Habakkuk", "Arabic": "حبقوق"},
    "ZEP": {"English": "Zephaniah", "Arabic": "صفنيا"},
    "HAG": {"English": "Haggai", "Arabic": "حجى"},
    "ZEC": {"English": "Zechariah", "Arabic": "زكريا"},
    "MAL": {"English": "Malachi", "Arabic": "ملاخي"},
    "MAT": {"English": "Matthew", "Arabic": "متى"},
    "MRK": {"English": "Mark", "Arabic": "مرقس"},
    "LUK": {"English": "Luke", "Arabic": "لوقا"},
    "JHN": {"English": "John", "Arabic": "يوحنا"},
    "ACT": {"English": "Acts", "Arabic": "أعمال الرسل"},
    "ROM": {"English": "Romans", "Arabic": "رومية"},
    "1CO": {"English": "1 Corinthians", "Arabic": "كورنثوس الأولى"},
    "2CO": {"English": "2 Corinthians", "Arabic": "كورنثوس الثانية"},
    "GAL": {"English": "Galatians", "Arabic": "غلاطية"},
    "EPH": {"English": "Ephesians", "Arabic": "أفسس"},
    "PHP": {"English": "Philippians", "Arabic": "فيلبي"},
    "COL": {"English": "Colossians", "Arabic": "كولوسي"},
    "1TH": {"English": "1 Thessalonians", "Arabic": "تسالونيكي الأولى"},
    "2TH": {"English": "2 Thessalonians", "Arabic": "تسالونيكي الثانية"},
    "1TI": {"English": "1 Timothy", "Arabic": "تيموثاوس الأولى"},
    "2TI": {"English": "2 Timothy", "Arabic": "تيموثاوس الثانية"},
    "TIT": {"English": "Titus", "Arabic": "تيطس"},
    "PHM": {"English": "Philemon", "Arabic": "فليمون"},
    "HEB": {"English": "Hebrews", "Arabic": "عبرانيين"},
    "JAS": {"English": "James", "Arabic": "يعقوب"},
    "1PE": {"English": "1 Peter", "Arabic": "بطرس الأولى"},
    "2PE": {"English": "2 Peter", "Arabic": "بطرس الثانية"},
    "1JN": {"English": "1 John", "Arabic": "يوحنا الأولى"},
    "2JN": {"English": "2 John", "Arabic": "يوحنا الثانية"},
    "3JN": {"English": "3 John", "Arabic": "يوحنا الثالثة"},
    "JUD": {"English": "Jude", "Arabic": "يهوذا"},
    "REV": {"English": "Revelation", "Arabic": "رؤيا يوحنا"}
}


def get_bibles(db_path: str, translations_ids: List[str]):
    trans_objs = [t for t in ALLOWED_TRANSLATIONS if t.id in translations_ids]
    assert len(trans_objs) == len(translations_ids), f"[err] bad translation ids given {translations_ids} | allowed: {[t.id for t in ALLOWED_TRANSLATIONS]}"

    content_objs: List[Content] = [Content(id=str(uuid.uuid4()), type=ContentType.bible) for i in range(len(trans_objs))]
    bible_objs: List[Bible]   = [Bible(id=c.id, translation_id=t.id) for c, t in zip(content_objs, trans_objs)]

    # Connect to the SQLite database (creates the file if it doesn't exist)
    conn = sqlite3.connect(db_path) 
    # conn.set_trace_callback(print)

    # Dynamically create placeholders (?, ?, ...) based on the number of translations
    placeholders = ', '.join(['?'] * len(translations_ids))

    # Create a cursor object to execute SQL commands
    cursor = conn.cursor()
    query = f"""
    SELECT id, language_english FROM version
    WHERE id IN ({placeholders})
    """
    cursor.execute(query, translations_ids)
    results = cursor.fetchall()
    

    ### Convert results:                i.e [('arb-vd', 'Arabic'), ('arbwbtc', 'Arabic')]
    ### to -> translation_language_map  i.e {'arb-vd': 'Arabic', 'arbwbtc': 'Arabic'}
    translation_language_map = {}
    for row in results:
        translation_id, language_english = row
        translation_language_map[translation_id] = language_english

    bible_books_objs: List[BibleBook] = []
    bible_books_chapters_objs: List[BibleChapter] = []
    slide_objs: List[Slide] = []
    slide_columns_objs: List[SlideColumn] = []
    for trans in (pbara := tqdm(translations_ids)):
        pbara.set_description(f"Processing bible translation: {trans}")
        query = f"""
        SELECT DISTINCT book FROM verse 
        WHERE version_id = ?
        ORDER BY canon_order;
        """
        cursor.execute(query, [trans])
        results = cursor.fetchall()
        
        bible_obj = [b for b in bible_objs if b.translation_id==trans][0]
        canon_order = 1
        for res in (pbarb := tqdm(results, leave=False)):
            book_name, = res
            pbarb.set_description(f"Processing bible book: {book_name} | translation: {trans}")
            language_key = translation_language_map[trans]
            book_name_translated = BOOKS_FULL_NAME_MAP[book_name][language_key]
            content_obj_book = Content(id=str(uuid.uuid4()), type=ContentType.bible_book)
            book_obj = BibleBook(id=content_obj_book.id, canon_order=canon_order ,bible_id=bible_obj.id, name_id=book_name ,name_lang=book_name_translated)

            content_objs.append(content_obj_book)
            bible_books_objs.append(book_obj)
            canon_order += 1

            query = f"""
            SELECT DISTINCT chapter FROM verse 
            WHERE version_id = ? AND book = ?;
            """
            cursor.execute(query, [trans, book_name])
            results = cursor.fetchall()

            for res in results:
                chapter_num, = res
                content_obj_chapter = Content(id=str(uuid.uuid4()), type=ContentType.bible_chapter)
                chapter_obj = BibleChapter(id=content_obj_chapter.id, bible_book_id=book_obj.id, number=chapter_num)
                content_objs.append(content_obj_chapter)
                bible_books_chapters_objs.append(chapter_obj)


                query = f"""
                SELECT text, start_verse FROM verse 
                WHERE version_id = ? AND book = ? AND chapter = ?;
                """
                cursor.execute(query, [trans, book_name, chapter_num])
                results = cursor.fetchall()
                for res in results:
                    verse_text, verse_num = res

                    slide_obj = Slide(id=str(uuid.uuid4()), content_id=chapter_obj.id, position=verse_num-1) # 0-based index

                    
                    slide_column = SlideColumn(id=str(uuid.uuid4()), content_type=ContentType.bible_chapter, slide_id=slide_obj.id, position=0, content=verse_text, header=f"{book_name_translated} {chapter_num}: {verse_num}")
                    slide_objs.append(slide_obj)
                    slide_columns_objs.append(slide_column)

    return Tables(content=content_objs, 
                bible_translation=trans_objs,
                bible=bible_objs,
                bible_book=bible_books_objs,
                bible_chapter=bible_books_chapters_objs,
                slide_column=slide_columns_objs,
                slide=slide_objs
                )