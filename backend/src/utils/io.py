from typing import List
import requests
from pathlib import Path
from models.openapi import Tables
import pandas as pd
import zipfile
import zstandard as zstd
from datetime import datetime

# Function to download a file from a URL
def download_file(url: str, file_path: Path):
    response = requests.get(url)
    file_path.write_bytes(response.content)

def zip_files(file_paths: List[Path], zip_filename: str):
    with zipfile.ZipFile(zip_filename, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        for file in file_paths:
            arcname = file.name
            zipf.write(file, arcname)

def save_tables_as_zip(tables: Tables, output_dir: Path, file_name: str):
    for field_name, value in tables:
        if value:
            df = pd.DataFrame(c.model_dump() for c in value)
            df.to_csv(output_dir / f"{field_name}.csv", index=False)
    csv_files_path = list(Path(output_dir).glob("*.csv"))
    order_file_path = output_dir / f"order"
    with open(order_file_path, "w+") as order_f:
        order_f.writelines(["content.csv\n", 
                            "tag.csv\n", 
                            "tag_assignment.csv\n", 
                            "pack.csv\n", 
                            "pack_item.csv\n",
                            "hymn.csv\n"
                            "liturgy.csv\n",
                            "liturgy_block.csv\n", 
                            "bible_translation.csv\n",
                            "bible.csv\n",
                            "bible_book.csv\n",
                            "bible_chapter.csv\n",
                            "slide.csv\n",
                            "slide_column.csv"])
        
    zip_file_path = output_dir / file_name
    all_files_to_zip = csv_files_path + [order_file_path]
    zip_files(all_files_to_zip, zip_file_path)
    [f.unlink() for f in all_files_to_zip]