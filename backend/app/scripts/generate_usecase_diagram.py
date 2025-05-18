import argparse
import base64
import sys
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

MODEL_MAP = {
    "o1": OpenAIO1Service,
    "o3": OpenAIo3Service,
    "o4": OpenAIo4Service,
}

def get_service(model: str):
    service_cls = MODEL_MAP.get(model, OpenAIO1Service)
    return service_cls()

def call_model(service, description: str, api_key: str | None):
    return service.call_o1_api(PROMPT, {"explanation": description}, api_key) if isinstance(service, OpenAIO1Service) else (
        service.call_o3_api(PROMPT, {"explanation": description}, api_key) if isinstance(service, OpenAIo3Service) else service.call_o4_api(PROMPT, {"explanation": description}, api_key)
    )

def render_svg(mermaid_code: str) -> bytes:
    resp = requests.post("https://kroki.io/mermaid/svg", data=mermaid_code.encode("utf-8"))
    resp.raise_for_status()
    return resp.content


def main(argv=None):
    parser = argparse.ArgumentParser(description="Generate a Mermaid diagram from a use case description")
    parser.add_argument("--description", help="Description of the use case")
    parser.add_argument("--output", required=True, help="Path to output SVG")
    parser.add_argument("--model", choices=["o1", "o3", "o4"], default="o1")
    parser.add_argument("--api-key", dest="api_key")
    args = parser.parse_args(argv)

    description = args.description
    if not description:
        description = sys.stdin.read()

    service = get_service(args.model)
    mermaid = call_model(service, description, args.api_key)
    svg_bytes = render_svg(mermaid)
    with open(args.output, "wb") as f:
        f.write(svg_bytes)
    print("Diagram saved to", args.output)

if __name__ == "__main__":
    main()
