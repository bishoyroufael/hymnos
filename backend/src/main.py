from contextlib import asynccontextmanager
from typing import Union
from fastapi import FastAPI
from brotli_asgi import BrotliMiddleware
from pydantic import TypeAdapter
from utils.openapi import custom_openapi
from models.hymnos import *
from routers import auth, data
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi.middleware.cors import CORSMiddleware
from models.api import *

# Start the scheduler on app startup
@asynccontextmanager
async def lifespan(_: FastAPI):
    data.start_background_jobs()
    FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")
    yield

app = FastAPI(lifespan=lifespan)
app.openapi = lambda : custom_openapi(app, [Hymn, HymnsPack, Tag, Slide, HymnosItems])

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(BrotliMiddleware)


app.include_router(auth.router)
app.include_router(data.router)

# @app.get("/test")
# async def test() -> CustomType:
#     return {"Status": "Ok!"}

@app.get("/")
async def read_root():
    return {"Status": "Ok!"}

# @app.get("/dbopenapi.json")
# async def db_models():
#     ta = TypeAdapter(Union[HymnsPack, Hymn, Tag, Slide])
#     ta_schema = ta.json_schema()
#     return ta_schema
