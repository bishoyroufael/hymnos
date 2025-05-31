from fastapi import APIRouter, FastAPI, HTTPException, Response
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pathlib import Path
from datetime import datetime
from fastapi_cache.decorator import cache
from fastapi.responses import FileResponse
from jobs.convert_tasbehna_job import run_tasbehna_convert_job
from utils.io import *
from fastapi_cache.coder import PickleCoder

router = APIRouter(prefix='/data')

# Scheduler for running tasks
scheduler = AsyncIOScheduler()

@router.get("/latest/download", response_description="Download latest JSON file", response_class=FileResponse)
@cache(expire=3*60*60, namespace="data", coder=PickleCoder)
async def download_latest_json():
    # todo: get blob with latest timestamp/uuid
    p = list(Path("./blobs").glob("*.zstd"))[0]
    return FileResponse(path=p, status_code=200)

# Schedule the job to run daily
def start_background_jobs():
    scheduler.add_job(run_tasbehna_convert_job, "interval", minutes=120, next_run_time=datetime.now())
    scheduler.start()