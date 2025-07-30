from uuid import uuid4
from utils.tasbehna import _convert_tasbe7na_to_hymnos, _get_tasbe7na_hymns
from pathlib import Path
import zstd


def run_tasbehna_convert_job():
    print("[job-info] running convert job for tasbehna hymns")
    # Get tasbe7na json file
    t_hymns = _get_tasbe7na_hymns(file_url="https://tasbe7na.com/tasbe7naDB.zip")
    items = _convert_tasbe7na_to_hymnos(t_hymns)
    return items