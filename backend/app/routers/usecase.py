from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, constr
import base64
import requests # Keep for now, but might remove if Kroki is fully deprecated
import openai # Assuming OpenAI SDK is used by services, for specific error types

# Import service classes (assuming they might raise specific errors)
from app.services.o1_mini_openai_service import OpenAIO1Service
from app.services.o3_mini_openai_service import OpenAIo3Service
from app.services.o4_mini_openai_service import OpenAIo4Service

# Timeout for Kroki.io request in seconds
KROKI_TIMEOUT = 20
# Max description length for use case
MAX_DESCRIPTION_LENGTH_USECASE = 5000

PROMPT = (
    "You are a helpful assistant that generates Mermaid.js diagrams. "
    "Given a description of an enterprise generative AI use case, decide the "
    "best diagram type (use case, sequence, gantt, etc.) and output ONLY the "
    "Mermaid syntax. Ensure the syntax uses the correct properties for the "
    "chosen diagram."
)

router = APIRouter(prefix="/usecase", tags=["Use Case Diagram"])

class UseCaseRequest(BaseModel):
    description: constr(max_length=MAX_DESCRIPTION_LENGTH_USECASE)
    model: str = "o1" # TODO: Consider Enum for models if list is fixed
    api_key: str | None = None

MODEL_MAP = {
    "o1": OpenAIO1Service,
    "o3": OpenAIo3Service,
    "o4": OpenAIo4Service,
}

def get_service(model: str):
    service_cls = MODEL_MAP.get(model) # Get will return None if model not in map
    if not service_cls:
        # Fallback to a default or raise an error for unsupported model
        # For now, defaulting to OpenAIO1Service if model key is invalid
        # Consider raising HTTPException for invalid model choice by client
        service_cls = OpenAIO1Service 
    return service_cls()

def call_model_safely(service, description: str, api_key: str | None) -> str:
    """
    Calls the AI model service with error handling.
    """
    try:
        if isinstance(service, OpenAIO1Service):
            return service.call_o1_api(PROMPT, {"explanation": description}, api_key)
        if isinstance(service, OpenAIo3Service):
            return service.call_o3_api(PROMPT, {"explanation": description}, api_key)
        if isinstance(service, OpenAIo4Service): # Explicitly check for o4
            return service.call_o4_api(PROMPT, {"explanation": description}, api_key)
        # Fallback for unhandled service types, though get_service should prevent this
        raise HTTPException(status_code=500, detail="Unsupported AI service configuration.")

    except openai.APITimeoutError as e:
        # Specific error for OpenAI client timeouts
        raise HTTPException(status_code=504, detail=f"AI service request timed out: {str(e)}")
    except openai.APIConnectionError as e:
        # Specific error for OpenAI client connection issues
        raise HTTPException(status_code=503, detail=f"Cannot connect to AI service: {str(e)}")
    except openai.APIStatusError as e:
        # Handle general API errors from OpenAI (e.g., 4xx, 5xx from OpenAI)
        status_code = 502 # Bad Gateway by default for upstream errors
        if e.status_code == 429: # Rate limit
            status_code = 429
        elif e.status_code == 400: # Bad request (e.g. invalid input for AI)
            status_code = 422 # Unprocessable Entity
        elif 400 <= e.status_code < 500: # Other client errors from AI
            status_code = 422 
        detail_msg = f"AI service error: {str(e)}"
        if "content management policy" in detail_msg.lower(): # Check for content policy violation
             detail_msg = "Input may violate content policy. Please revise your description."
             status_code = 400 # Bad request from user
        raise HTTPException(status_code=status_code, detail=detail_msg)
    except Exception as e:
        # Catch-all for other unexpected errors from AI services
        # Log the error e server-side for debugging
        print(f"Unexpected AI service error: {e}") # Basic logging
        raise HTTPException(status_code=500, detail="An unexpected error occurred with the AI service.")


# Decision: Removing Kroki.io rendering from the primary path.
# The frontend will handle SVG/PNG generation from Mermaid code.
# render_svg function can be removed or kept for internal/future use but not called by default.

# def render_svg_with_kroki(mermaid_code: str) -> bytes:
#     """
#     Renders Mermaid code to SVG using Kroki.io with timeout and error handling.
#     This function is currently NOT USED in the main endpoint.
#     """
#     try:
#         resp = requests.post(
#             "https://kroki.io/mermaid/svg",
#             data=mermaid_code.encode("utf-8"),
#             timeout=KROKI_TIMEOUT
#         )
#         resp.raise_for_status() # Raises HTTPError for bad responses (4xx or 5xx)
#         return resp.content
#     except requests.exceptions.Timeout:
#         raise HTTPException(status_code=504, detail="Diagram rendering service (Kroki.io) timed out.")
#     except requests.exceptions.RequestException as e:
#         # Handles connection errors, non-200 status codes after raise_for_status(), etc.
#         # Log the error e server-side
#         print(f"Kroki.io request failed: {e}") # Basic logging
#         raise HTTPException(status_code=502, detail=f"Diagram rendering service (Kroki.io) failed: {str(e)}")


@router.post("", response_model=dict) # Keeping response_model generic for now
async def generate_diagram_from_usecase(body: UseCaseRequest):
    """
    Generates a Mermaid diagram from a user's textual description.
    """
    service = get_service(body.model)
    
    mermaid_code = call_model_safely(service, body.description, body.api_key)

    if not mermaid_code or mermaid_code.strip() == "":
        # Handle cases where AI might return empty or whitespace-only string
        raise HTTPException(status_code=500, detail="AI service failed to generate diagram content.")

    # Primary response is just the Mermaid code
    return {"mermaid": mermaid_code}
