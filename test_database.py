
from database import (
    initialize_database,
    save_incident,
    load_incident,
)

initialize_database()

test_incident = {
    "id": "TEST-001",
    "title": "SQLite persistence test",
    "status": "open",
    "severity": "low",
    "machine": "TEST-MACHINE",
    "batch_id": "TEST-BATCH",
    "audit_log": [],
}

save_incident(test_incident)
loaded = load_incident("TEST-001")

assert loaded == test_incident, "Saved incident did not match!"
print("PASS: Incident saved and loaded correctly.")
print("Loaded incident:", loaded)
