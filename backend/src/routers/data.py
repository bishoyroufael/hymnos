from fastapi import APIRouter, FastAPI, HTTPException
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pathlib import Path
import json
from utils.io import *

router = APIRouter(prefix='/data')

# Define the folder for saving assets
PACKS_FOLDER = Path("assets/packs")
TASBE7NA_ASSETS_FOLDER = Path("assets/.tasbe7na")
TASBE7NA_ASSETS_FOLDER.mkdir(parents=True, exist_ok=True)
PACKS_FOLDER.mkdir(parents=True, exist_ok=True)

# Define the URL of the file to download
FILE_URL = "https://tasbe7na.com/tasbe7naDB.zip"

# Scheduler for running tasks
scheduler = AsyncIOScheduler()


@router.get("/latest/hash", response_description="Get latest file hash")
async def get_latest_hash():
    # Find the latest folder by timestamp
    extracted_folders = sorted(TASBE7NA_ASSETS_FOLDER.glob("*_*"), reverse=True)
    if not extracted_folders:
        raise HTTPException(status_code=404, detail="No extracted folders found.")

    hash = extracted_folders[0].name.split("_")[-1]
    return {"hash": hash}

    
@router.get("/latest/download", response_description="Download latest JSON file")
async def download_latest_json():
    # Find the latest folder by timestamp
    extracted_folders = sorted(TASBE7NA_ASSETS_FOLDER.glob("*_*"), reverse=True)
    if not extracted_folders:
        raise HTTPException(status_code=404, detail="No extracted folders found.")

    latest_folder = extracted_folders[0]
    
    # Find JSON files in the latest folder
    json_files = list(latest_folder.glob("*.json"))
    if not json_files:
        raise HTTPException(status_code=404, detail="No JSON file found in the latest folder.")

    # Return the contents of the latest JSON file
    latest_json_file = json_files[0]

    return json.loads(latest_json_file.read_text())

# Schedule the job to run daily
# def start_background_jobs():
#     scheduler.add_job(handle_tasbe7na_data_download, "interval", minutes=1, args=(TASBE7NA_ASSETS_FOLDER, FILE_URL))
#     scheduler.start()