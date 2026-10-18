
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

API_KEY = os.getenv("RADEON_API_KEY")
BASE_URL = os.getenv(
    "RADEON_BASE_URL",
    "https://developer.amd.com.cn/radeon/api/v1"
)
MODEL = os.getenv("RADEON_MODEL", "DeepSeek-V4-Flash")


def investigate_incident(incident: dict) -> dict:
    """Use AMD-hosted AI to analyze a simulated factory incident."""

    if not API_KEY:
        raise RuntimeError("RADEON_API_KEY is missing from .env")

    client = OpenAI(
        api_key=API_KEY,
        base_url=BASE_URL,
        timeout=90.0,
        max_retries=1,
    )

    prompt = f"""
Investigate this SIMULATED industrial quality incident.

INCIDENT DATA:
{incident}

Return a clear investigation with these sections:
1. Known facts: only facts explicitly present in the data.
2. Hypotheses: possible causes, clearly labelled unconfirmed.
3. Evidence gaps: additional information needed.
4. Containment: conservative immediate recommendations.
5. Next steps: ordered investigation actions.

Rules:
- Never present a hypothesis as a confirmed cause.
- Do not invent machine readings, affected batches, or evidence.
- Recommend human review before consequential actions.
- Do not claim that you executed any physical action.
- This is a simulated incident, not a real factory system.
- Keep the entire report concise and complete.
- Limit hypotheses to 3 and evidence gaps to 5.
- Use brief bullet points and finish all 5 sections.
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are AEGIS, an industrial quality "
                    "incident investigation assistant. "
                    "Be precise, cautious, and evidence-driven."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=1500,
    )

    content = response.choices[0].message.content

    if not content:
        raise RuntimeError("The AMD model returned an empty response.")

    return {
        "model": MODEL,
        "analysis": content,
        "status": "ai_investigation_completed",
        "requires_human_review": True,
        "simulated": True,
    }
