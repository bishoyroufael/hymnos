from contextlib import asynccontextmanager
from typing import Union
from fastapi import FastAPI
from brotli_asgi import BrotliMiddleware
from routers import auth, data

# Start the scheduler on app startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    data.start_scheduler()
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(BrotliMiddleware)
app.include_router(auth.router)
app.include_router(data.router)


@app.get("/")
async def read_root():
    return {"Status": "Ok!"}
