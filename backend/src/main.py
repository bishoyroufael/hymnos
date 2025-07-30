# from contextlib import asynccontextmanager
# from typing import Union
# from fastapi import FastAPI
# from brotli_asgi import BrotliMiddleware
# from pydantic import TypeAdapter
# from utils.openapi import custom_openapi
# from routers import auth, data
# from fastapi_cache import FastAPICache
# from fastapi_cache.backends.inmemory import InMemoryBackend
# from fastapi.middleware.cors import CORSMiddleware


# Start the scheduler on app startup
# @asynccontextmanager
# async def lifespan(_: FastAPI):
#     data.start_background_jobs()
#     FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")
#     yield

# app = FastAPI(lifespan=lifespan)

# origins = ["*"]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
# app.add_middleware(BrotliMiddleware)


# app.include_router(auth.router)
# app.include_router(data.router)


# @app.get("/")
# async def read_root():
#     return {"Status": "Ok!"}

from pathlib import Path
from jobs.tasbehna import run_tasbehna_convert_job
from jobs.giant_bible import get_bibles, ALLOWED_TRANSLATIONS
import argparse
import time
import pandas as pd
from utils.io import *
from utils.data import *

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate hymns and/or bibles")
    parser.add_argument("--gen-hymns", action="store_true", help="Run the hymns generator")
    parser.add_argument("--gen-bibles", action="store_true", help="Run the bibles generator")
    parser.add_argument("--giant-bible-db-path", type=str, help="Path for Giant Bible SQLite Database")
    parser.add_argument("--translations-ids", type=str, help=f"Comma seperated translation ids of bibles to get, allowed values: {[t.id for t in ALLOWED_TRANSLATIONS]}", default="arb-vd")

    args = parser.parse_args()

    if not args.gen_hymns and not args.gen_bibles:
        parser.error("No generation flags provided. Use --gen-hymns and/or --gen-bibles.")
    # Conditional requirement check
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
    # print(len(tables_hymns.slide_column))
    # print(len(tables_bible.slide_column))
    # merged = merge_pydantic_models(tables_hymns, tables_bible)
    # print(len(merged.slide_column))
        save_tables_as_zip(tables_bible, OUTPUT_PATH, "bibles_pglite_import.zip");
