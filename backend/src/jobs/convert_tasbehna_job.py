from uuid import uuid4
from utils.tasbehna import convert_tasbe7na_to_hymnos, get_tasbe7na_hymns
from pathlib import Path
import zstd

BLOBS_FOLDER = Path('./blobs')
BLOBS_FOLDER.mkdir(exist_ok=True, parents=True)

def run_tasbehna_convert_job():
    print("[job-info] running convert job for tasbehna hymns")
    # Get tasbe7na json file
    t_hymns = get_tasbe7na_hymns(file_url="https://tasbe7na.com/tasbe7naDB.zip")
    items = convert_tasbe7na_to_hymnos(t_hymns)

    # temp for hot reload
    if len(list(BLOBS_FOLDER.glob("*.zstd"))) > 0:
        print("[job-info] skipping write to disk..")
        return

    blob_uuid = uuid4() 
    # zstd compression of pack
    with open(BLOBS_FOLDER / f"{blob_uuid}.json.zstd", "wb") as f:
        f.write(zstd.compress(items.model_dump_json().encode()))