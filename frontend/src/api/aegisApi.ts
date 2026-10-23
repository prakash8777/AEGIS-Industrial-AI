
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

async function apiRequest(path: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.detail || `API request failed: ${response.status}`,
    )
  }

  return data
}

export function getIncidents() {
  return apiRequest('/api/incidents')
}

export function checkBackendHealth() {
  return apiRequest('/api/health')
}

export function investigateIncident(incidentId: string) {
  return apiRequest(
    `/api/incidents/${encodeURIComponent(incidentId)}/investigate`,
    { method: 'POST' },
  )
}

export function approveAction(
  incidentId: string,
  actionId: string,
  reviewer = 'Demo Reviewer',
  approved = true,
) {
  return apiRequest(
    `/api/incidents/${encodeURIComponent(incidentId)}/actions/${encodeURIComponent(actionId)}/approve`,
    {
      method: 'POST',
      body: JSON.stringify({
        reviewer,
        approved,
        notes: 'Approved for simulated hackathon demonstration only.',
      }),
    },
  )
}

export function verifyIncident(
  incidentId: string,
  temperatureC = 60,
  measurementMm = 10,
) {
  return apiRequest(
    `/api/incidents/${encodeURIComponent(incidentId)}/verify`,
    {
      method: 'POST',
      body: JSON.stringify({
        temperature_c: temperatureC,
        measurement_mm: measurementMm,
      }),
    },
  )
}
