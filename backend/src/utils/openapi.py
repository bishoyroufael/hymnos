from typing import Dict, List
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel

def add_model_to_schema(m: BaseModel, openapi_schema: Dict):
    n = m.__name__
    # Ensure "components" exists
    if "components" not in openapi_schema:
        openapi_schema["components"] = {}

    # Ensure "schemas" exists inside "components"
    if "schemas" not in openapi_schema["components"]:
        openapi_schema["components"]["schemas"] = {}

    key = m.__name__
    openapi_schema["components"]["schemas"][key] = m.model_json_schema(ref_template="#/components/schemas/{model}")
    


def custom_openapi(app: FastAPI, models: List[BaseModel] = []):
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Hymnos API OpenAPI",
        version="1.0.0",
        summary="This is the OpenAPI schema of the hymnos API",
        description="Description of the custom **OpenAPI** schema",
        routes=app.routes,
    )

    # Add custom types to openapi
    for m in models:
        add_model_to_schema(m, openapi_schema)

    app.openapi_schema = openapi_schema
    return app.openapi_schema
  
