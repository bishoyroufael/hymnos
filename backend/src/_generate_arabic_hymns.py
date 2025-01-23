from pydantic import BaseModel
from typing import List, Optional
from pydantic_core import from_json
from fast_langdetect import detect
import uuid
from models.hymnos import HymnosPack, HymnosHymn, HymnosSlide
from pathlib import Path
import time
import zipfile
import requests
import shutil

ASSETS_FOLDER = Path("./assets")
PACKS_FOLDER = Path("./assets/packs")
ASSETS_FOLDER.mkdir(exist_ok=True, parents=True)
PACKS_FOLDER.mkdir(exist_ok=True, parents=True)

class Tasbe7naHymn(BaseModel):
    title: str | None
    formated: bool | None
    verses: List[List[str]] | None
    chorus: List[str] | None
    chorusFirst: bool | None

# Function to download a file from a URL
def download_file(url: str, file_path: Path):
    response = requests.get(url)
    file_path.write_bytes(response.content)

# Combine all strings
def combine_song(title: Optional[str], verses: Optional[List[List[str]]], chorus: Optional[List[str]]) -> str:
    parts = [title] if title else []
    if verses:
        parts.extend(line for verse in verses for line in (verse + (chorus or [])))
    return '. '.join(parts).replace("\n", ". ")

def process_tasbe7na_db(json_file, packs_folder):
    hynms_tasbe7na : List[Tasbe7naHymn] = from_json(json_file.read_text())
    arabic_hymns = [h for h in hynms_tasbe7na if (detect(combine_song(h.get('title'), h.get('verses'), h.get('chorus')), low_memory=False)['lang'] in ['ar', 'arz', 'fa'] )] 
    hymnos_hymns = [HymnosHymn(id=str(uuid.uuid4())[:8], 
                              title=h.get("title"), 
                              author_words=None, 
                              author_music=None, 
                              chorusFirst=h.get("chorusFirst")) 
                                        for h in arabic_hymns]
    
    for hymnos_hymn, arabic_hymn in zip(hymnos_hymns, arabic_hymns):
        # Process verses
        for verse in arabic_hymn.get("verses", []):
            for text in verse:
                hymnos_hymn.verses.append(HymnosSlide(lines=text.splitlines()))

        # Process chorus
        if (chorus := arabic_hymn.get("chorus")):
            for text in chorus:
                hymnos_hymn.chorus.append(HymnosSlide(lines=text.splitlines()))

    pack_id = str(uuid.uuid4())[:8]
    arabic_pack = HymnosPack(id=pack_id,title="Hymnos Arabic Hymns", author="Hymnos", version="v1.0", hymns=hymnos_hymns, description="An Arabic collection of hymns collected from varioud resources.")
    print(f"Pack containing: {len(arabic_pack.hymns)} hymns")
    with open(packs_folder / f"{pack_id}.json", "w") as f:
        f.write(arabic_pack.model_dump_json(indent=2)) 
        print(f"dumped pack {pack_id}")

# Main function to download, check, and extract the file
def generate_arabic_pack_from_tasbe7na(file_url: str, assets_folder: Path, packs_folder: Path):
    temp_file_path = assets_folder / "temp_file.zip"
    download_file(file_url, temp_file_path)

    timestamp = time.strftime("%Y%m%d_%H%M%S")
    new_folder = assets_folder / f"tasbe7na_{timestamp}"
    new_folder.mkdir(exist_ok=True)

    with zipfile.ZipFile(temp_file_path, 'r') as zip_ref:
        zip_ref.extractall(new_folder)
    
    temp_file_path.unlink()
    print(f"File downloaded and extracted to {new_folder}")

    json_db = list(new_folder.glob("*.json"))[0]
    packs_folder = Path("./assets/packs")
    packs_folder.mkdir(exist_ok=True, parents=True)
    process_tasbe7na_db(json_db, packs_folder)
    shutil.rmtree(new_folder)

if __name__ == "__main__":
    generate_arabic_pack_from_tasbe7na(file_url="https://tasbe7na.com/tasbe7naDB.zip", assets_folder=ASSETS_FOLDER, packs_folder=PACKS_FOLDER)