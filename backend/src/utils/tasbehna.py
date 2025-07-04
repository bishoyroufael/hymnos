import uuid
from pydantic import BaseModel
from typing import List, Optional
from pydantic_core import from_json
from fast_langdetect import detect
from utils.io import download_file
from pathlib import Path
import time
import zipfile
import shutil
from uuid import uuid4
from datetime import datetime
from models.openapi import *

class Tasbe7naHymn(BaseModel):
    title: str | None
    formated: bool | None
    verses: List[List[str]] | None
    chorus: List[str] | None
    chorusFirst: bool | None

def is_array_of_array_of_strings(var):
    return (
        isinstance(var, list) and
        all(isinstance(inner, list) and all(isinstance(s, str) for s in inner) for inner in var)
    )

def n_create_hymn(tasbe7na_hymn) -> Tables:
    hymn_content = Content(id=str(uuid4()), type=ContentType.hymn)
    hymn_obj = Hymn(id=hymn_content.id, name=tasbe7na_hymn.get('title'))
    # For number conversion
    arabic = '۰١٢٣٤٥٦٧٨٩'
    english = '0123456789'
    translation_table = str.maketrans(english, arabic)

    slides_in_hymn: List[Slide] = []
    all_columns: List[SlideColumn] = []
    chorus_slides: List[Slide] = []
    chorus_columns: List[SlideColumn] = []



    if (chorus := tasbe7na_hymn.get("chorus")):
        for n, text in enumerate(chorus): # Array
            slide = Slide(id=str(uuid4()), content_id=hymn_content.id)
            column = SlideColumn(id=str(uuid4()), slide_id=slide.id, content=text, header= "(ق)" if n==0 else None, position=0)
            # append to chorus specific variables
            chorus_slides.append(slide)
            chorus_columns.append(column)
            # append to all arrays
            # slides_in_hymn.append(slide)
            # all_columns.append(column)

    # print(len(chorus_slides), len(chorus_columns))

    # has only chorus array and no verses nor chorusFirst specified
    if tasbe7na_hymn.get("chorusFirst") or (tasbe7na_hymn.get("chorusFirst") == None and tasbe7na_hymn.get("verses") == []):
        slides_in_hymn.extend(chorus_slides)
        all_columns.extend(chorus_columns)

    v_num = 1
    for verse in tasbe7na_hymn.get("verses"):
        for n, text in enumerate(verse): # Array
            slide = Slide(id=str(uuid4()), content_id=hymn_content.id)
            column = SlideColumn(id=str(uuid4()), slide_id=slide.id, content=text, header=f"({v_num})".translate(translation_table) if n==0 else None, position=0)
            slides_in_hymn.append(slide)
            all_columns.append(column)
        v_num+=1

        # Append chorus slides and its columns again with new ids (database restricts uuids)
        new_chorus_slides = [Slide(**{**s.model_dump(), "id": str(uuid4())}) for s in chorus_slides]
        new_chorus_columns_slides = [SlideColumn(**{**c.model_dump(), "id": str(uuid4()), "slide_id": s.id}) for c, s in zip(chorus_columns, new_chorus_slides)]
        slides_in_hymn.extend(new_chorus_slides)
        all_columns.extend(new_chorus_columns_slides)

    for n, sl in enumerate(slides_in_hymn):
        sl.position = n

    assert_unique_slide_constraints(slides_in_hymn)
    assert_valid_slide_columns(all_columns, slides_in_hymn)

    return Tables(contents=[hymn_content], hymns=[hymn_obj], slides=slides_in_hymn, slide_columns=all_columns)


from collections import Counter

def assert_unique_slide_constraints(slides: list[Slide]):
    # Ensure no duplicate UUIDs
    ids = [slide.id for slide in slides]
    id_counts = Counter(ids)
    duplicate_ids = [id_ for id_, count in id_counts.items() if count > 1]
    assert not duplicate_ids, f"Duplicate slide IDs found: {duplicate_ids}"

    # Ensure (content_id, position) pairs are unique (ignoring None positions)
    key_pairs = [(slide.content_id, slide.position) for slide in slides if slide.position is not None]
    key_pair_counts = Counter(key_pairs)
    duplicate_pairs = [pair for pair, count in key_pair_counts.items() if count > 1]
    assert not duplicate_pairs, f"Duplicate (content_id, position) pairs found: {duplicate_pairs}"



def assert_valid_slide_columns(columns: List[SlideColumn], slides: List[Slide]):
    # Collect valid slide IDs
    valid_slide_ids = {slide.id for slide in slides}

    # Check unique UUIDs
    ids = [col.id for col in columns]
    id_counts = Counter(ids)
    duplicate_ids = [id_ for id_, count in id_counts.items() if count > 1]
    assert not duplicate_ids, f"Duplicate SlideColumn IDs found: {duplicate_ids}"

    # Check unique (slide_id, position) pairs
    key_pairs = [(col.slide_id, col.position) for col in columns]
    key_pair_counts = Counter(key_pairs)
    duplicate_pairs = [pair for pair, count in key_pair_counts.items() if count > 1]
    assert not duplicate_pairs, f"Duplicate (slide_id, position) pairs in SlideColumn: {duplicate_pairs}"

    # Check that slide_id refers to a valid Slide ID
    invalid_fk = [col for col in columns if col.slide_id not in valid_slide_ids]
    assert not invalid_fk, f"Invalid slide_id references in SlideColumn: {[col.slide_id for col in invalid_fk]} | {[col for col in columns if col.slide_id in invalid_fk]}"



# Combine all strings
def combine_song(title: Optional[str], verses: Optional[List[List[str]]], chorus: Optional[List[str]]) -> str:
    parts = [title] if title else []
    if verses:
        parts.extend(line for verse in verses for line in (verse + (chorus or [])))
    return '. '.join(parts).replace("\n", ". ")

def convert_tasbe7na_to_hymnos(hymns_tasbe7na):
    arabic_hymns = [h for h in hymns_tasbe7na if (detect(combine_song(h.get('title'), h.get('verses'), h.get('chorus')), low_memory=False)['lang'] in ['ar', 'arz', 'fa'] )] 
    all_tables = Tables(contents=[], hymns=[], slide_columns=[],slides=[])
    for h in arabic_hymns:
        tables = n_create_hymn(h)
        all_tables.contents.extend(tables.contents)
        all_tables.slides.extend(tables.slides)
        all_tables.slide_columns.extend(tables.slide_columns)
        all_tables.hymns.extend(tables.hymns)
    # Create Pack for hymns
    hymn_pack = Pack(id=str(uuid4()), name="Hymnos Arabic Hymns", author="Hymnos App", description="Collection of Arabic Hymns")
    hymn_pack_items = [PackItem(pack_id=hymn_pack.id, content_id=c.id) for c in all_tables.contents]
    all_tables.packs = [hymn_pack]
    all_tables.packs_items = hymn_pack_items
    return all_tables


# Main function to download, check, and extract the file
def get_tasbe7na_hymns(file_url: str):
    temp_file_path = Path(".temp.zip")
    download_file(file_url, temp_file_path)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    new_folder = Path(f"tasbe7na_{timestamp}")
    new_folder.mkdir(exist_ok=True)

    with zipfile.ZipFile(temp_file_path, 'r') as zip_ref:
        zip_ref.extractall(new_folder)
    
    temp_file_path.unlink()

    try:
        json_db = from_json(list(new_folder.glob("*.json"))[0].read_text(encoding='utf-8'))
    except Exception as e:
        print(e)
    finally:
        shutil.rmtree(new_folder)

    return json_db