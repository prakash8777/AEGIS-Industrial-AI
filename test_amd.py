
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("RADEON_API_KEY")
base_url = os.getenv(
    "RADEON_BASE_URL",
    "https://developer.amd.com.cn/radeon/api/v1"
)
model = os.getenv("RADEON_MODEL", "DeepSeek-V4.1-Flash")

if not api_key:
    raise SystemExit(
        "RADEON_API_KEY is missing. Check your .env file."
    )

client = OpenAI(
    api_key=api_key,
    base_url=base_url,
    timeout=90.0,
    max_retries=0
)

try:
    print("Checking AMD model availability...")

    models = client.models.list()
    available_models = [item.id for item in models.data]

    print("\nAvailable model IDs:")
    for model_id in available_models:
        print("-", model_id)

    if model not in available_models:
        raise SystemExit(
            f"\nModel '{model}' was not found. "
            "Update RADEON_MODEL in .env to an exact listed ID."
        )

    print(f"\nTesting inference with {model}...")

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are AEGIS, an industrial quality "
                    "incident investigation assistant. "
                    "Separate known facts from hypotheses. "
                    "Never claim a cause is confirmed without evidence."
                )
            },
            {
                "role": "user",
                "content": (
                    "SIMULATED FACTS: A CNC machine reads 86 C. "
                    "Its reference temperature is 65 C. A batch "
                    "also failed dimensional inspection at 10.42 mm, "
                    "outside the permitted 9.90-10.10 mm range. "
                    "Give one possible explanation, two additional "
                    "pieces of evidence to collect, and one immediate "
                    "containment recommendation. Do not claim the "
                    "temperature caused the defect."
                )
            }
        ],
        temperature=0.2,
        max_tokens=400
    )

    print("\n" + "=" * 50)
    print("AEGIS — AMD INFERENCE TEST")
    print("=" * 50)
    print(response.choices[0].message.content)
    print("\nSUCCESS: AMD inference is working.")

except Exception as exc:
    print(f"\nAPI request failed: {type(exc).__name__}: {exc}")
    print(
        "\nCheck the API key, model ID, endpoint, account status, "
        "and rate limits. Do not share your API key."
    )
