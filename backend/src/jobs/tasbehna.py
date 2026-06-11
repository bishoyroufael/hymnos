from uuid import uuid4
from utils.tasbehna import convert_tasbe7na_to_hymnos, get_tasbe7na_sqlite_db
from pathlib import Path
import zstd


def run_tasbehna_convert_job():
    print("[job-info] running convert job for tasbehna hymns")
    # Get tasbe7na json file
    db_path = get_tasbe7na_sqlite_db()
    
    items = convert_tasbe7na_to_hymnos(db_path)
    return items