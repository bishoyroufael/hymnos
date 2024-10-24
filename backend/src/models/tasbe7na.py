from pydantic import BaseModel
from typing import List, Optional

class Tasbe7naHymn(BaseModel):
    title: str | None
    formated: bool | None
    verses: List[List[str]] | None
    chorus: List[str] | None
    chorusFirst: bool | None


from pathlib import Path
from pydantic_core import from_json
from tqdm import tqdm
# from langdetect import detect, detect_langs
# from langdetect import DetectorFactory
# DetectorFactory.seed = 10
from fast_langdetect import detect


# Combine all strings
def combine_song(title: Optional[str], verses: Optional[List[List[str]]], chorus: Optional[List[str]]) -> str:
    parts = []
    
    if title:
        parts.append(title)
    
    if verses:
        for verse in verses:
            # Add verse lines
            parts.extend(verse)
            # Add chorus after each verse
            if chorus:
                parts.extend(chorus)
    
    # Combine everything with ". " as separator
    return '. '.join(parts).replace("\n", ". ")

def convert_tasbe7na_json_to_default_packs(folder):
    json_file = list(Path(folder).glob("*.json"))[0]
    hynms_tasbe7na : List[Tasbe7naHymn] = from_json(json_file.read_text())
    arabic_hymns = [h for h in hynms_tasbe7na if (detect(combine_song(h.get('title'), h.get('verses'), h.get('chorus')), low_memory=False)['lang'] in ['ar', 'arz', 'fa'] )] 
    print(arabic_hymns[0].get('verses'))


convert_tasbe7na_json_to_default_packs("assets/20241002_004225_78eed85688edbb18f8c17332bc3b8999bf60b3db2feac83a7a37c73fce2b8d53")