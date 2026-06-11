from pathlib import Path
from jobs.tasbehna import run_tasbehna_convert_job
from jobs.giant_bible import get_bibles, ALLOWED_TRANSLATIONS
import argparse
import time
import pandas as pd
from utils.io import *
from utils.data import *

if __name__ == "__main__":
    example_command = "python src/main.py --gen-hymns --gen-bibles --giant-bible-db-path /home/bishoyroufael/Documents/giant_bible.sqlite --translations-ids arb-vd --gen-liturgy --one-coptic-library-db-path /home/bishoyroufael/Documents/app.db"
    parser = argparse.ArgumentParser(description=f"Generate hymns, bibles, and/or liturgy | Example Usage: {example_command}")
    parser.add_argument("--gen-hymns", action="store_true", help="Run the hymns generator")
    parser.add_argument("--gen-bibles", action="store_true", help="Run the bibles generator")
    parser.add_argument("--giant-bible-db-path", type=str, help="Path for Giant Bible SQLite Database")
    parser.add_argument("--translations-ids", type=str, help=f"Comma seperated translation ids of bibles to get, allowed values: {[t.id for t in ALLOWED_TRANSLATIONS]}", default="arb-vd")

    args = parser.parse_args()

    if not args.gen_hymns and not args.gen_bibles:
        parser.error("No generation flags provided. Use --gen-hymns, and/or --gen-bibles.")
    # Conditional requirement checks
    if args.gen_bibles and not args.giant_bible_db_path:
        parser.error("--giant-bible-db-path is required when --gen-bibles is used")

    OUTPUT_PATH = Path('./output')
    OUTPUT_PATH.mkdir(exist_ok=True, parents=True)
    if args.gen_hymns:
        s = time.time()
        tables_hymns = run_tasbehna_convert_job()
        e = time.time()
        print(f"[info] Hymns generated successfully in {e-s:.2f}s")
        save_tables_as_zip(tables_hymns, OUTPUT_PATH, "hymns_pglite_import.zip");
    
    if args.gen_bibles:
        s = time.time()
        tables_bible = get_bibles(args.giant_bible_db_path, str(args.translations_ids).split(',') )
        e = time.time()
        print(f"[info] Bibles: {args.translations_ids} generated successfully in {e-s:.2f}s")
        save_tables_as_zip(tables_bible, OUTPUT_PATH, "bibles_pglite_import.zip")
