from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import base64
import requests

from app.services.o1_mini_openai_service import OpenAIO1Service
from app.services.o3_mini_openai_service import OpenAIo3Service
from app.services.o4_mini_openai_service import OpenAIo4Service

PROMPT = (
    "You are a helpful assistant that generates Mermaid.js diagrams. "
    "Given a description of an enterprise generative AI use case, decide the "
    "best diagram type (use case, sequence, gantt, etc.) and output ONLY the "
    "Mermaid syntax. Ensure the syntax uses the correct properties for the "
    "chosen diagram."
)

router = APIRouter(prefix="/usecase", tags=["Use Case Diagram"])

class UseCaseRequest(BaseModel):
    description: str
    model: str = "o1"
    api_key: str | None = None

MODEL_MAP = {
    "o1": OpenAIO1Service,
    "o3": OpenAIo3Service,
    "o4": OpenAIo4Service,
}

def get_service(model: str):
    service_cls = MODEL_MAP.get(model, OpenAIO1Service)
    return service_cls()

def call_model(service, description: str, api_key: str | None):
    if isinstance(service, OpenAIO1Service):
        return service.call_o1_api(PROMPT, {"explanation": description}, api_key)
    if isinstance(service, OpenAIo3Service):
        return service.call_o3_api(PROMPT, {"explanation": description}, api_key)
    return service.call_o4_api(PROMPT, {"explanation": description}, api_key)

def render_svg(mermaid_code: str) -> bytes:
    resp = requests.post("https://kroki.io/mermaid/svg", data=mermaid_code.encode("utf-8"))
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="Kroki rendering failed")
    return resp.content

@router.post("")
async def generate_diagram(body: UseCaseRequest):
    service = get_service(body.model)
    mermaid = call_model(service, body.description, body.api_key)
    svg_bytes = render_svg(mermaid)
    svg_b64 = base64.b64encode(svg_bytes).decode("utf-8")
    return {"svg": svg_b64, "mermaid": mermaid}
