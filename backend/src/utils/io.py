from typing import List
import json
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

def _row_for_csv(model) -> dict:
    """Serialize a Pydantic model into a flat, CSV-safe row.

    Uses ``mode="json"`` so enums become their string values (and UUIDs become
    strings); nested dict/list fields (e.g. ``slide_block.metadata`` JSONB) are
    re-encoded with ``json.dumps`` so the CSV cell is valid JSON for ``COPY``
    into a JSONB column rather than a Python ``repr``.
    """
    row = model.model_dump(mode="json")
    for key, val in row.items():
        if isinstance(val, (dict, list)):
            row[key] = json.dumps(val, ensure_ascii=False)
    return row

def save_tables_as_zip(tables: Tables, output_dir: Path, file_name: str):
    for field_name, value in tables:
        if value:
            df = pd.DataFrame(_row_for_csv(c) for c in value)
            df.to_csv(output_dir / f"{field_name}.csv", index=False)
    csv_files_path = list(Path(output_dir).glob("*.csv"))
        
    zip_file_path = output_dir / file_name
    zip_files(csv_files_path, zip_file_path)
    [f.unlink() for f in csv_files_path]