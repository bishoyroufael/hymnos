from pydantic import BaseModel
from typing import List, Optional
from pydantic_core import from_json
from fast_langdetect import detect
from models.api import HymnosItems
from utils.io import download_file
from models.hymnos import Hymn, Slide, HymnsPack
from pathlib import Path
import time
import zipfile
import shutil
from uuid import uuid4
from datetime import datetime


class Tasbe7naHymn(BaseModel):
    title: str | None
    formated: bool | None
    verses: List[List[str]] | None
    chorus: List[str] | None
    chorusFirst: bool | None


# Combine all strings
def combine_song(title: Optional[str], verses: Optional[List[List[str]]], chorus: Optional[List[str]]) -> str:
    parts = [title] if title else []
    if verses:
        parts.extend(line for verse in verses for line in (verse + (chorus or [])))
    return '. '.join(parts).replace("\n", ". ")

def convert_tasbe7na_to_hymnos(hymns_tasbe7na):
    arabic_hymns = [h for h in hymns_tasbe7na if (detect(combine_song(h.get('title'), h.get('verses'), h.get('chorus')), low_memory=False)['lang'] in ['ar', 'arz', 'fa'] )] 
    hymnos_hymns = [Hymn(uuid=str(uuid4()),title=h.get("title"), 
                              author_words=None, 
                              author_music=None) 
                                        for h in arabic_hymns]
    hymnos_slides = [] 
    for hymnos_hymn, arabic_hymn in zip(hymnos_hymns, arabic_hymns):
        # we should know the order to present the slides in
        # add verses slides in order and a gap between them for chorus slides
        slides_per_hymn_order = []
        chorus_slides_ids = [] 
        # Process chorus first
        if (chorus := arabic_hymn.get("chorus")):
            for text in chorus:
                slide_uuid = str(uuid4())
                slide = Slide(uuid=slide_uuid,lines=text.splitlines(), hymn_uuid=hymnos_hymn.uuid)
                hymnos_hymn.chorus.append(slide_uuid)
                hymnos_slides.append(slide)
                chorus_slides_ids.append(slide_uuid)

        # has only chorus array and no verses nor chorusFirst specified
        if arabic_hymn.get("chorusFirst") or (arabic_hymn.get("chorusFirst") == None and arabic_hymn.get("verses") == []):
            slides_per_hymn_order.extend(chorus_slides_ids)

        # Process verses
        for verse in arabic_hymn.get("verses"):
            for text in verse:
                slide_uuid = str(uuid4())
                slide = Slide(uuid=slide_uuid,lines=text.splitlines(), hymn_uuid=hymnos_hymn.uuid)
                hymnos_hymn.verses.append(slide_uuid)
                hymnos_slides.append(slide)
                slides_per_hymn_order.append(slide_uuid)
            # Chorus slides lies between verses
            slides_per_hymn_order.extend(chorus_slides_ids)

        # ! slides order array cannot be empty otherwise 
        # ! something is wrong in the above logic
        assert(len(slides_per_hymn_order) != 0)
        hymnos_hymn.slides_order = slides_per_hymn_order


    # pack_id = "bed3c7ee" #str(uuid.uuid4())[:8]
    arabic_pack = HymnsPack(uuid=str(int(datetime.now().timestamp())),
                            title="Hymnos Arabic Hymns", 
                            author="Hymnos", 
                            version="v1.0", 
                            description="An Arabic collection of hymns collected from varioud resources.",
                            hymns_uuid=[h.uuid for h in hymnos_hymns])

    # print(f"Pack containing: {len(arabic_pack.hymns)} hymns")
    # with open(BLOBS_FOLDER / f"{pack_id}.json", "w") as f:
    #     # f.write(arabic_pack.model_dump_json(indent=2)) 
    #     ujson.dump(arabic_pack.model_dump_json(), f, ensure_ascii = False)
    return HymnosItems(packs=[arabic_pack], hymns=hymnos_hymns, slides=hymnos_slides) 


# Main function to download, check, and extract the file
def get_tasbe7na_hymns(file_url: str):
    temp_file_path = Path(".temp.zip")
    download_file(file_url, temp_file_path)

    timestamp = time.strftime("%Y%m%d_%H%M%S")
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