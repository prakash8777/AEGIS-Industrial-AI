
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ai_engine import investigate_incident
from database import initialize_database, load_incident, save_incident


# All data below is SIMULATED for the hackathon demo.
INCIDENTS: dict[str, dict[str, Any]] = {
    "INC-001": {
        "id": "INC-001",
        "title": "Dimensional quality failure — Batch B-204",
        "status": "open",
        "severity": "high",
        "machine": "CNC-07",
        "batch_id": "B-204",
        "inspection": {
            "measurement_mm": 10.42,
            "minimum_mm": 9.90,
            "maximum_mm": 10.10,
            "result": "fail",
        },
        "machine_readings": {
            "temperature_c": 86,
            "reference_temperature_c": 65,
        },
        "related_batches": ["B-203", "B-205"],
        "evidence": [
            "B-204 dimensional measurement is outside the stated specification.",
            "CNC-07 temperature is above its stated reference.",
            "The cause of the dimensional failure has not been confirmed.",
        ],
        "investigation": None,
        "actions": [
            {
                "id": "ACT-001",
                "title": "Quarantine affected batch B-204",
                "description": (
                    "Simulate holding B-204 for quality review. "
                    "Confirm related-batch scope before expanding the hold."
                ),
                "status": "proposed",
            }
        ],
        "verification": None,
        "audit_log": [],
    }
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize SQLite and restore saved incident state."""
    initialize_database()

    for incident_id in list(INCIDENTS):
        saved_incident = load_incident(incident_id)

        if saved_incident is not None:
            INCIDENTS[incident_id] = saved_incident
        else:
            save_incident(INCIDENTS[incident_id])

    yield


app = FastAPI(
    title="AEGIS Industrial Incident Commander",
    description=(
        "AI-assisted investigation of simulated industrial "
        "quality incidents. Consequential actions require approval."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# Allow the local React + Vite frontend to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def record_event(
    incident: dict,
    event: str,
    details: dict | None = None,
):
    incident["audit_log"].append(
        {
            "timestamp": timestamp(),
            "event": event,
            "details": details or {},
        }
    )


def get_incident(incident_id: str) -> dict:
    incident = INCIDENTS.get(incident_id)

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    return incident


class ApprovalRequest(BaseModel):
    reviewer: str = Field(min_length=2, max_length=100)
    approved: bool
    notes: str = Field(default="", max_length=500)


class VerificationRequest(BaseModel):
    # Simulated values only; these are not real sensor readings.
    temperature_c: float = Field(ge=-50, le=500)
    measurement_mm: float = Field(ge=0, le=10000)


@app.get("/")
def root():
    return {
        "name": "AEGIS",
        "message": "Industrial Quality Incident Commander API",
        "docs": "/docs",
        "simulated_data": True,
    }


@app.get("/api/health")
def health():
    return {"status": "healthy", "simulated_data": True}


@app.get("/api/incidents")
def list_incidents():
    return [
        {
            "id": incident["id"],
            "title": incident["title"],
            "status": incident["status"],
            "severity": incident["severity"],
            "batch_id": incident["batch_id"],
            "machine": incident["machine"],
        }
        for incident in INCIDENTS.values()
    ]


@app.get("/api/incidents/{incident_id}")
def incident_details(incident_id: str):
    return get_incident(incident_id)


@app.post("/api/incidents/{incident_id}/investigate")
def investigate(incident_id: str):
    incident = get_incident(incident_id)

    try:
        result = investigate_incident(incident)
    except Exception as exc:
        # Keep raw provider errors and API keys out of client responses.
        print(f"AI investigation failed: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="AI investigation failed. Check the backend terminal.",
        ) from None

    incident["investigation"] = result
    incident["status"] = "investigating"

    record_event(
        incident,
        "ai_investigation_completed",
        {"model": result["model"], "human_review_required": True},
    )
    save_incident(incident)

    return {
        "incident_id": incident_id,
        "investigation": result,
        "message": "AI analysis completed; human review is required.",
    }


@app.post("/api/incidents/{incident_id}/actions/{action_id}/approve")
def approve_action(
    incident_id: str,
    action_id: str,
    request: ApprovalRequest,
):
    incident = get_incident(incident_id)

    if incident["investigation"] is None:
        raise HTTPException(
            status_code=409,
            detail="Complete the AI investigation before reviewing actions.",
        )

    action = next(
        (item for item in incident["actions"] if item["id"] == action_id),
        None,
    )

    if action is None:
        raise HTTPException(status_code=404, detail="Action not found")

    if action["status"] != "proposed":
        raise HTTPException(
            status_code=409,
            detail="This action has already been reviewed.",
        )

    if not request.approved:
        action["status"] = "rejected"
        action["reviewer"] = request.reviewer
        action["review_notes"] = request.notes

        record_event(
            incident,
            "action_rejected",
            {
                "action_id": action_id,
                "reviewer": request.reviewer,
                "notes": request.notes,
            },
        )
        save_incident(incident)

        return {
            "action": action,
            "message": "Action rejected by reviewer.",
        }

    action["status"] = "approved_simulation"
    action["reviewer"] = request.reviewer
    action["review_notes"] = request.notes

    record_event(
        incident,
        "action_approved_for_simulation",
        {
            "action_id": action_id,
            "reviewer": request.reviewer,
            "notes": request.notes,
        },
    )
    save_incident(incident)

    return {
        "action": action,
        "message": (
            "Approved for the demo simulation only. "
            "No physical equipment or real inventory was changed."
        ),
    }


@app.post("/api/incidents/{incident_id}/verify")
def verify_incident(
    incident_id: str,
    request: VerificationRequest,
):
    incident = get_incident(incident_id)

    if incident["verification"] is not None:
        raise HTTPException(
            status_code=409,
            detail="This incident has already been verified.",
        )

    approved_action = any(
        action["status"] == "approved_simulation"
        for action in incident["actions"]
    )

    if not approved_action:
        raise HTTPException(
            status_code=409,
            detail="A reviewer must approve a simulated action first.",
        )

    spec = incident["inspection"]
    temperature_reference = incident["machine_readings"][
        "reference_temperature_c"
    ]

    measurement_pass = (
        spec["minimum_mm"]
        <= request.measurement_mm
        <= spec["maximum_mm"]
    )
    temperature_pass = request.temperature_c <= temperature_reference

    result = {
        "measurement_mm": request.measurement_mm,
        "measurement_within_spec": measurement_pass,
        "temperature_c": request.temperature_c,
        "temperature_at_or_below_reference": temperature_pass,
        "verification_passed": measurement_pass and temperature_pass,
        "simulated": True,
        "note": (
            "These are manually submitted demo values, not readings "
            "from a real machine or sensor."
        ),
    }

    incident["verification"] = result
    incident["status"] = (
        "verification_passed"
        if result["verification_passed"]
        else "needs_further_investigation"
    )

    record_event(incident, "simulated_verification_completed", result)
    save_incident(incident)

    return result
