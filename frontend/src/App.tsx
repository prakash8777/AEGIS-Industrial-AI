import { useEffect, useState } from 'react'
import './App.css'
import {
  checkBackendHealth,
  getIncidents,
  investigateIncident,

} from './api/aegisApi'

type IncidentStatus =
  | 'Under Investigation'
  | 'Pending Review'
  | 'Monitoring'
  | 'Resolved'

type Incident = {
  id: string
  title: string
  product: string
  machine: string
  severity: 'Critical' | 'High' | 'Medium'
  status: IncidentStatus
  time: string
}



type IncidentEvidence = {
  inspectionTitle: string
  inspectionDescription: string
  expectedValue: string
  measuredValue: string
  deviation: string
  temperature: string
  vibration: string
  sensorDescription: string
  logTitle: string
  logDescription: string
  logTime: string
  logNote: string
}

const incidentEvidence: Record<string, IncidentEvidence> = {
  'INC-001': {
    inspectionTitle: 'Dimensional Inspection',
    inspectionDescription: 'Illustrative dimensional inspection for Precision Housing.',
    expectedValue: '25.0 mm',
    measuredValue: '25.8 mm',
    deviation: '+0.8 mm',
    temperature: '68 °C',
    vibration: '4.2 mm/s',
    sensorDescription: 'Illustrative readings from CNC-07.',
    logTitle: 'Calibration Record',
    logDescription: 'Example maintenance log for CNC-07.',
    logTime: '08:30 AM',
    logNote: 'Calibration record requires verification.',
  },
  'INC-002': {
    inspectionTitle: 'Thermal Inspection',
    inspectionDescription: 'Illustrative inspection for Thermal Component.',
    expectedValue: '180 °C',
    measuredValue: '205 °C',
    deviation: '+25 °C',
    temperature: '205 °C',
    vibration: '2.1 mm/s',
    sensorDescription: 'Illustrative readings from OVEN-03.',
    logTitle: 'Temperature Control Log',
    logDescription: 'Example process log for OVEN-03.',
    logTime: '09:35 AM',
    logNote: 'Temperature-control records require verification.',
  },
  'INC-003': {
    inspectionTitle: 'Material Inspection',
    inspectionDescription: 'Illustrative material inspection for Alloy Bracket.',
    expectedValue: '60 HRC',
    measuredValue: '52 HRC',
    deviation: '-8 HRC',
    temperature: '42 °C',
    vibration: '3.0 mm/s',
    sensorDescription: 'Illustrative readings from PRESS-02.',
    logTitle: 'Incoming Material Record',
    logDescription: 'Example material inspection record.',
    logTime: '09:10 AM',
    logNote: 'Incoming material records require verification.',
  },
}

type RootCause = {
  title: string
  supportingEvidence: string
  contradictoryEvidence: string
  missingEvidence: string
}

const rootCauseData: Record<string, RootCause[]> = {
  'INC-001': [
    {
      title: 'Machine calibration drift',
      supportingEvidence:
        'The illustrative measurement is 25.8 mm against an expected value of 25.0 mm.',
      contradictoryEvidence: 'No verified calibration failure is available.',
      missingEvidence: 'Calibration history and independent measurement results.',
    },
    {
      title: 'Tool wear',
      supportingEvidence:
        'Tool wear is a possible explanation for dimensional variation.',
      contradictoryEvidence:
        'No evidence currently confirms excessive tool wear.',
      missingEvidence: 'Tool inspection results and maintenance history.',
    },
    {
      title: 'Incoming material variation',
      supportingEvidence:
        'Material variation could contribute to dimensional differences.',
      contradictoryEvidence: 'No incoming material measurements are available.',
      missingEvidence: 'Incoming material inspection records.',
    },
  ],
  'INC-002': [
    {
      title: 'Temperature-control malfunction',
      supportingEvidence:
        'The illustrative process reading is 205 °C against an expected value of 180 °C.',
      contradictoryEvidence:
        'No verified controller malfunction has been established.',
      missingEvidence: 'Controller logs and verified operating limits.',
    },
    {
      title: 'Incorrect process settings',
      supportingEvidence:
        'An incorrect setpoint could contribute to excessive process temperature.',
      contradictoryEvidence:
        'The actual configured setpoint has not been provided.',
      missingEvidence: 'Approved process settings and operator records.',
    },
    {
      title: 'Temperature sensor error',
      supportingEvidence:
        'An inaccurate sensor could produce an incorrect temperature reading.',
      contradictoryEvidence:
        'No independent temperature measurement is available.',
      missingEvidence:
        'Sensor calibration records and an independent measurement.',
    },
  ],
  'INC-003': [
    {
      title: 'Incoming material quality issue',
      supportingEvidence:
        'The illustrative hardness measurement is 52 HRC against an expected value of 60 HRC.',
      contradictoryEvidence:
        'No verified incoming material inspection record is available.',
      missingEvidence:
        'Material certification and independent hardness testing.',
    },
    {
      title: 'Incorrect material specification',
      supportingEvidence:
        'A specification mismatch could explain the difference in expected material properties.',
      contradictoryEvidence:
        'The approved material specification has not been verified.',
      missingEvidence: 'Purchase order and approved material specification.',
    },
    {
      title: 'Measurement or testing error',
      supportingEvidence:
        'Testing method or instrument error could affect the reported hardness.',
      contradictoryEvidence: 'No repeat test results are available.',
      missingEvidence:
        'Test method, instrument calibration, and repeat measurements.',
    },
  ],
}

type BatchRecord = {
  batchId: string
  product: string
  machine: string
  productionTime: string
  relationship: string
  assessment: string
  reason: string
}

const batchTraceability: Record<string, BatchRecord[]> = {
  'INC-001': [
    {
      batchId: 'BATCH-101',
      product: 'Precision Housing',
      machine: 'CNC-07',
      productionTime: '09:30 AM',
      relationship: 'Original incident batch',
      assessment: 'Affected in simulation',
      reason:
        'This batch is explicitly associated with the dimensional incident in the simulated records.',
    },
    {
      batchId: 'BATCH-102',
      product: 'Precision Housing',
      machine: 'CNC-07',
      productionTime: '09:45 AM',
      relationship: 'Same machine; later production',
      assessment: 'Potential risk',
      reason:
        'The simulated record links this batch to the same machine, but its individual inspection results are unavailable.',
    },
    {
      batchId: 'BATCH-103',
      product: 'Precision Housing',
      machine: 'CNC-05',
      productionTime: '09:50 AM',
      relationship: 'No documented connection',
      assessment: 'Link not established',
      reason:
        'No simulated production record currently connects this batch to the incident.',
    },
  ],
  'INC-002': [
    {
      batchId: 'BATCH-201',
      product: 'Thermal Component',
      machine: 'OVEN-03',
      productionTime: '09:20 AM',
      relationship: 'Original incident batch',
      assessment: 'Affected in simulation',
      reason:
        'This batch is explicitly associated with the temperature incident in the simulated records.',
    },
    {
      batchId: 'BATCH-202',
      product: 'Thermal Component',
      machine: 'OVEN-03',
      productionTime: '09:35 AM',
      relationship: 'Same machine; later production',
      assessment: 'Potential risk',
      reason:
        'The simulated record links this batch to the same oven, but its temperature exposure has not been verified.',
    },
    {
      batchId: 'BATCH-203',
      product: 'Thermal Component',
      machine: 'OVEN-01',
      productionTime: '09:40 AM',
      relationship: 'No documented connection',
      assessment: 'Link not established',
      reason:
        'No simulated production record currently connects this batch to the incident.',
    },
  ],
  'INC-003': [
    {
      batchId: 'BATCH-301',
      product: 'Alloy Bracket',
      machine: 'PRESS-02',
      productionTime: '09:00 AM',
      relationship: 'Original incident batch',
      assessment: 'Affected in simulation',
      reason:
        'This batch is explicitly associated with the material-quality incident in the simulated records.',
    },
    {
      batchId: 'BATCH-302',
      product: 'Alloy Bracket',
      machine: 'PRESS-02',
      productionTime: '09:15 AM',
      relationship: 'Shared machine; material link unverified',
      assessment: 'Potential risk',
      reason:
        'The simulated record links this batch to the same press, but shared material lot information is unavailable.',
    },
    {
      batchId: 'BATCH-303',
      product: 'Alloy Bracket',
      machine: 'PRESS-04',
      productionTime: '09:25 AM',
      relationship: 'No documented connection',
      assessment: 'Link not established',
      reason:
        'No simulated production record currently connects this batch to the incident.',
    },
  ],
}

type VerificationRecord = {
  beforeValue: string
  afterValue: string
  expectedValue: string
  unit: string
  status: 'Passed' | 'Failed' | 'Inconclusive'
  evidence: string
  remainingRisk: string
  nextStep: string
}

const verificationData: Record<string, VerificationRecord> = {
  'INC-001': {
    beforeValue: '25.8',
    afterValue: '25.2',
    expectedValue: '25.0',
    unit: 'mm',
    status: 'Failed',
    evidence:
      'Illustrative post-action measurement remains outside the assumed ±0.1 mm acceptance tolerance.',
    remainingRisk:
      'The dimensional deviation remains unresolved in this simulation.',
    nextStep:
      'Inspect the machine calibration and repeat the measurement before releasing the batch.',
  },
  'INC-002': {
    beforeValue: '205',
    afterValue: '182',
    expectedValue: '180',
    unit: '°C',
    status: 'Inconclusive',
    evidence:
      'The illustrative temperature decreased, but verified operating limits and stabilization results are unavailable.',
    remainingRisk:
      'The process temperature has not been confirmed to be within its approved operating limits.',
    nextStep:
      'Check the approved temperature limits and obtain a verified reading after the process stabilizes.',
  },
  'INC-003': {
    beforeValue: '52',
    afterValue: '60',
    expectedValue: '60',
    unit: 'HRC',
    status: 'Passed',
    evidence:
      'The illustrative post-action hardness reading matches the expected value. Independent confirmation is still recommended.',
    remainingRisk:
      'The simulated result does not establish that other batches from the same material lot are acceptable.',
    nextStep:
      'Arrange an independent material test and review batch traceability before closing the incident.',
  },
}

type ActionStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Executed'

type ContainmentAction = {
  id: number
  incidentId: string
  title: string
  description: string
  priority: 'Critical' | 'High' | 'Medium'
  status: ActionStatus
}

type AuditEntry = {
  id: number
  incidentId: string
  actionTitle: string
  event: string
  timestamp: string
}

const initialContainmentActions: ContainmentAction[] = [
  {
    id: 1,
    incidentId: 'INC-001',
    title: 'Hold affected batch for inspection',
    description:
      'Request inspection of the affected batch before it proceeds further in production.',
    priority: 'Critical',
    status: 'Pending Approval',
  },
  {
    id: 2,
    incidentId: 'INC-002',
    title: 'Review thermal component readings',
    description:
      'Request a review of the recorded temperature readings and relevant operating limits.',
    priority: 'High',
    status: 'Pending Approval',
  },
  {
    id: 3,
    incidentId: 'INC-003',
    title: 'Verify material inspection records',
    description:
      'Request verification of the material inspection documentation.',
    priority: 'Medium',
    status: 'Approved',
  },
]

function App() {
  const [backendOnline, setBackendOnline] = useState(false)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [aiReport, setAiReport] = useState('')

  const investigationTasks = [
    {
      id: 1,
      title: 'Verify the dimensional measurement',
      description:
        'Confirm the measurement using an appropriate inspection instrument.',
    },
    {
      id: 2,
      title: 'Review the product specification',
      description:
        'Confirm the expected dimension and its permitted tolerance.',
    },
    {
      id: 3,
      title: 'Check CNC-07 calibration records',
      description: 'Review the calibration and maintenance history.',
    },
    {
      id: 4,
      title: 'Document the investigation evidence',
      description:
        'Record verified observations for review by a qualified engineer.',
    },
  ]

  const [selectedIncident, setSelectedIncident] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
    setAiReport('')
    setApiError('')
  }, [selectedIncident])

  const [incidents, setIncidents] = useState<Incident[]>([])

  const [completedTasks, setCompletedTasks] = useState<number[]>([])

  const [severityFilter, setSeverityFilter] = useState('All')

  const [statusFilter, setStatusFilter] = useState('All')

  const [searchQuery, setSearchQuery] = useState('')

  const [containmentActions, setContainmentActions] = useState(
    initialContainmentActions
  )

  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])

  // Backend connection check. Must stay above the early return below
  // so hooks run in the same order on every render.
  useEffect(() => {
    async function loadBackendData() {
      try {
        await checkBackendHealth()
        setBackendOnline(true)

 const data = await getIncidents()

console.log('Backend incidents response:', data)
console.log('Is array:', Array.isArray(data))

const records = Array.isArray(data)
  ? data
  : Array.isArray(data?.incidents)
    ? data.incidents
    : []

const mapped: Incident[] = records.map((item: any) => ({
  id: item.id,
  title: item.title,
  product: item.batch_id ?? 'Unknown batch',
  machine: item.machine ?? 'Unknown machine',
  severity:
    item.severity?.toLowerCase() === 'critical'
      ? 'Critical'
      : item.severity?.toLowerCase() === 'medium'
        ? 'Medium'
        : 'High',
  status:
    item.status === 'verification_passed'
      ? 'Resolved'
      : item.status === 'investigating'
        ? 'Under Investigation'
        : 'Pending Review',
  time: 'Backend record',
}))

console.log('Mapped incidents:', mapped)
setIncidents(mapped)
      } catch (error) {
        setBackendOnline(false)
        setApiError(
          error instanceof Error ? error.message : 'Backend connection failed'
        )
      }
    }

    void loadBackendData()
  }, [])

  const currentIncident = incidents.find(
    (incident) => incident.id === selectedIncident
  )

  const currentEvidence = selectedIncident
    ? incidentEvidence[selectedIncident]
    : undefined

  const currentRootCauses = selectedIncident
    ? rootCauseData[selectedIncident] ?? []
    : []

  const currentBatches = selectedIncident
    ? batchTraceability[selectedIncident] ?? []
    : []

  const currentVerification = selectedIncident
    ? verificationData[selectedIncident]
    : undefined

  const totalIncidents = incidents.length

  const criticalIncidents = incidents.filter(
    (incident) => incident.severity === 'Critical'
  ).length

  const incidentsUnderInvestigation = incidents.filter(
    (incident) => incident.status === 'Under Investigation'
  ).length

  const filteredIncidents = incidents.filter((incident) => {

    const matchesSeverity =
      severityFilter === 'All' || incident.severity === severityFilter

    const matchesStatus =
      statusFilter === 'All' || incident.status === statusFilter

    const query = searchQuery.toLowerCase().trim()

    const matchesSearch =
      incident.id.toLowerCase().includes(query) ||
      incident.title.toLowerCase().includes(query) ||
      incident.product.toLowerCase().includes(query) ||
      incident.machine.toLowerCase().includes(query)

    return matchesSeverity && matchesStatus && matchesSearch
  })

  const pendingActions = containmentActions.filter(
    (action) => action.status === 'Pending Approval'
  ).length

  const approvedActions = containmentActions.filter(
    (action) => action.status === 'Approved'
  ).length

  const rejectedActions = containmentActions.filter(
    (action) => action.status === 'Rejected'
  ).length

  const completedCount = completedTasks.length

  const progress = Math.round(
    (completedCount / investigationTasks.length) * 100
  )

  function toggleTask(taskId: number) {
    setCompletedTasks((previousTasks) =>
      previousTasks.includes(taskId)
        ? previousTasks.filter((id) => id !== taskId)
        : [...previousTasks, taskId]
    )
  }

  function updateIncidentStatus(
    incidentId: string,
    newStatus: IncidentStatus
  ) {
    setIncidents((previousIncidents) =>
      previousIncidents.map((incident) =>
        incident.id === incidentId
          ? { ...incident, status: newStatus }
          : incident
      )
    )
  }

  async function runAIInvestigation(incidentId: string) {
    setApiLoading(true)
    setApiError('')
    setAiReport('')

    try {
      const result = (await investigateIncident(incidentId)) as {
        analysis?: string
      }
      setAiReport(result.analysis ?? JSON.stringify(result, null, 2))
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'AI investigation failed'
      )
    } finally {
      setApiLoading(false)
    }
  }

  function updateActionStatus(actionId: number, newStatus: ActionStatus) {
    const action = containmentActions.find((item) => item.id === actionId)

    if (!action) return

    // An action must be approved before simulated execution.
    if (newStatus === 'Executed' && action.status !== 'Approved') {
      window.alert('This action must be approved before it can be executed.')
      return
    }

    // Prevent repeating an execution.
    if (action.status === 'Executed') {
      window.alert('This action has already been executed in the simulation.')
      return
    }

    const eventMessages: Record<ActionStatus, string> = {
      'Pending Approval': 'Returned to pending approval',
      Approved: 'Action approved by human reviewer',
      Rejected: 'Action rejected by human reviewer',
      Executed: 'Simulated action executed',
    }

    setContainmentActions((previousActions) =>
      previousActions.map((item) =>
        item.id === actionId ? { ...item, status: newStatus } : item
      )
    )

    const entry: AuditEntry = {
      id: Date.now(),
      incidentId: action.incidentId,
      actionTitle: action.title,
      event: eventMessages[newStatus],
      timestamp: new Date().toLocaleString(),
    }

    setAuditEntries((previousEntries) => [entry, ...previousEntries])
  }

  if (currentIncident) {
    return (
      <div className="app">
        <main className="main-content incident-detail-page">
          <button
            className="refresh-button"
            onClick={() => setSelectedIncident(null)}
          >
            ← Back to Operations
          </button>

          <p className="eyebrow">INCIDENT INVESTIGATION</p>
          <h1>{currentIncident.title}</h1>

          <div className="detail-card">
            <h2>AEGIS AI Investigation</h2>

            <p>
              {backendOnline
                ? 'AMD AI backend connected'
                : 'Backend connection not confirmed'}
            </p>

            <button
              className="refresh-button"
              disabled={apiLoading || !backendOnline}
              onClick={() => void runAIInvestigation(currentIncident.id)}
            >
              {apiLoading ? 'Investigating...' : 'Run AMD AI Investigation'}
            </button>

            {apiError && <p role="alert">{apiError}</p>}

            {aiReport && (
              <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {aiReport}
              </pre>
            )}
          </div>

          <p className="page-description">
            Review incident information and investigate the available evidence.
          </p>

          <section className="detail-card">
            <p className="eyebrow">INCIDENT IDENTIFICATION</p>
            <h2>{currentIncident.id}</h2>

            <div className="detail-grid">
              <div>
                <span>Product</span>
                <strong>{currentIncident.product}</strong>
              </div>

              <div>
                <span>Machine</span>
                <strong>{currentIncident.machine}</strong>
              </div>

              <div>
                <span>Severity</span>
                <strong>{currentIncident.severity}</strong>
              </div>

              <div className="incident-status-control">
                <span>Status</span>

                <select
                  value={currentIncident.status}
                  onChange={(event) =>
                    updateIncidentStatus(
                      currentIncident.id,
                      event.target.value as IncidentStatus
                    )
                  }
                  aria-label="Update incident status"
                >
                  <option value="Under Investigation">
                    Under Investigation
                  </option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Monitoring">Monitoring</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>
          </section>

          <section className="detail-card evidence-section">
            <div className="evidence-heading">
              <div>
                <p className="eyebrow">INVESTIGATION WORKSPACE</p>
                <h2>Evidence & Analysis</h2>
                <p className="page-description">
                  Review available evidence before drawing conclusions.
                </p>
              </div>

              <span className="demo-badge">SIMULATED EVIDENCE</span>
            </div>

            <div className="evidence-grid">
              <div className="evidence-card">
                <div className="evidence-card-top">
                  <span className="evidence-icon">◎</span>
                  <span className="evidence-type">INSPECTION</span>
                </div>

                <h3>{currentEvidence?.inspectionTitle}</h3>

                <p className="evidence-description">
                  {currentEvidence?.inspectionDescription}
                </p>

                <div className="measurement-row">
                  <span>Expected</span>
                  <strong>{currentEvidence?.expectedValue}</strong>
                </div>

                <div className="measurement-row">
                  <span>Measured</span>
                  <strong className="measurement-alert">
                    {currentEvidence?.measuredValue}
                  </strong>
                </div>

                <div className="measurement-result">
                  Deviation: {currentEvidence?.deviation}
                </div>
              </div>

              <div className="evidence-card">
                <div className="evidence-card-top">
                  <span className="evidence-icon sensor-icon">⌁</span>
                  <span className="evidence-type">SENSOR READING</span>
                </div>

                <h3>Machine Sensors</h3>

                <p className="evidence-description">
                  {currentEvidence?.sensorDescription}
                </p>

                <div className="measurement-row">
                  <span>Temperature</span>
                  <strong>{currentEvidence?.temperature}</strong>
                </div>

                <div className="measurement-row">
                  <span>Vibration</span>
                  <strong>{currentEvidence?.vibration}</strong>
                </div>

                <div className="evidence-note">
                  Reference limits not configured.
                </div>
              </div>

              <div className="evidence-card">
                <div className="evidence-card-top">
                  <span className="evidence-icon log-icon">≡</span>
                  <span className="evidence-type">MACHINE LOG</span>
                </div>

                <h3>{currentEvidence?.logTitle}</h3>

                <p className="evidence-description">
                  {currentEvidence?.logDescription}
                </p>

                <div className="log-entry">
                  <span className="log-dot"></span>
                  <div>
                    <strong>Calibration review</strong>
                    <p>Last recorded: {currentEvidence?.logTime}</p>
                  </div>
                </div>

                <div className="evidence-note">{currentEvidence?.logNote}</div>
              </div>
            </div>

            <div className="evidence-disclaimer">
              <span>ⓘ</span>
              These records are illustrative examples, not verified factory
              data. No root cause has been established.
            </div>
          </section>

          <section className="detail-card findings-section">
            <section className="detail-card root-cause-section">
              <div className="root-cause-heading">
                <div>
                  <p className="eyebrow">PRELIMINARY INVESTIGATION</p>
                  <h2>Root Cause Analysis</h2>
                  <p className="page-description">
                    Compare possible explanations and identify evidence still
                    needed.
                  </p>
                </div>

                <span className="demo-badge">SIMULATED ANALYSIS</span>
              </div>

              <div className="root-cause-list">
                {currentRootCauses.map((cause, index) => (
                  <article className="root-cause-card" key={cause.title}>
                    <span className="finding-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="root-cause-content">
                      <h3>{cause.title}</h3>

                      <div className="root-cause-detail">
                        <strong>Supporting evidence</strong>
                        <p>{cause.supportingEvidence}</p>
                      </div>

                      <div className="root-cause-detail">
                        <strong>Contradictory evidence / limitations</strong>
                        <p>{cause.contradictoryEvidence}</p>
                      </div>

                      <div className="root-cause-detail">
                        <strong>Evidence still needed</strong>
                        <p>{cause.missingEvidence}</p>
                      </div>

                      <span className="finding-tag">
                        NOT CONFIRMED · FURTHER INVESTIGATION REQUIRED
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="findings-warning">
                <span>ⓘ</span>
                <p>
                  These are simulated hypotheses, not AI-generated conclusions.
                  No root cause is confirmed. A qualified engineer must evaluate
                  the evidence before determining the actual cause.
                </p>
              </div>
            </section>
          </section>

          <section className="detail-card batch-traceability-section">
            <div className="batch-traceability-heading">
              <div>
                <p className="eyebrow">PRODUCTION TRACEABILITY</p>
                <h2>Batch Traceability</h2>
                <p className="page-description">
                  Review documented production relationships and potential
                  exposure.
                </p>
              </div>

              <span className="demo-badge">SIMULATED RECORDS</span>
            </div>

            <div className="batch-list">
              {currentBatches.map((batch) => (
                <article className="batch-card" key={batch.batchId}>
                  <div className="batch-card-heading">
                    <div>
                      <span className="eyebrow">BATCH ID</span>
                      <h3>{batch.batchId}</h3>
                    </div>

                    <span
                      className={`batch-assessment ${
                        batch.assessment === 'Potential risk'
                          ? 'potential-risk'
                          : batch.assessment === 'Affected in simulation'
                            ? 'simulated-affected'
                            : 'link-unestablished'
                      }`}
                    >
                      {batch.assessment}
                    </span>
                  </div>

                  <div className="batch-details-grid">
                    <div>
                      <span>Product</span>
                      <strong>{batch.product}</strong>
                    </div>

                    <div>
                      <span>Machine</span>
                      <strong>{batch.machine}</strong>
                    </div>

                    <div>
                      <span>Production time</span>
                      <strong>{batch.productionTime}</strong>
                    </div>
                  </div>

                  <div className="batch-relationship">
                    <strong>Documented relationship</strong>
                    <p>{batch.relationship}</p>
                  </div>

                  <div className="batch-reason">
                    <strong>Assessment explanation</strong>
                    <p>{batch.reason}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="findings-warning">
              <span>ⓘ</span>
              <p>
                All batch records are simulated. Potential risk does not
                establish that a batch is defective. No connection is assumed
                where the simulated records do not establish one.
              </p>
            </div>
          </section>

          <section className="detail-card verification-section">
            <div className="verification-heading">
              <div>
                <p className="eyebrow">CORRECTIVE ACTION VALIDATION</p>
                <h2>Verification & Corrective Action Results</h2>
                <p className="page-description">
                  Compare illustrative measurements before and after a simulated
                  corrective action.
                </p>
              </div>

              <span className="demo-badge">SIMULATED RESULTS</span>
            </div>

            {currentVerification && (
              <>
                <div className="verification-measurements">
                  <div className="verification-measurement">
                    <span>Before action</span>
                    <strong>
                      {currentVerification.beforeValue}{' '}
                      {currentVerification.unit}
                    </strong>
                  </div>

                  <div className="verification-measurement">
                    <span>Expected value</span>
                    <strong>
                      {currentVerification.expectedValue}{' '}
                      {currentVerification.unit}
                    </strong>
                  </div>

                  <div className="verification-measurement">
                    <span>After action</span>
                    <strong>
                      {currentVerification.afterValue}{' '}
                      {currentVerification.unit}
                    </strong>
                  </div>
                </div>

                <div className="verification-status-row">
                  <span>Verification status</span>

                  <span
                    className={`verification-status ${currentVerification.status.toLowerCase()}`}
                  >
                    {currentVerification.status}
                  </span>
                </div>

                <div className="verification-detail">
                  <strong>Verification evidence</strong>
                  <p>{currentVerification.evidence}</p>
                </div>

                <div className="verification-detail">
                  <strong>Remaining risks</strong>
                  <p>{currentVerification.remainingRisk}</p>
                </div>

                <div className="verification-detail">
                  <strong>Recommended next step</strong>
                  <p>{currentVerification.nextStep}</p>
                </div>
              </>
            )}

            <div className="findings-warning">
              <span>ⓘ</span>
              <p>
                These are illustrative simulated results, not measurements from
                real industrial equipment. A Passed status does not authorize
                product release or replace required human approval.
              </p>
            </div>
          </section>

          <section className="detail-card findings-section">
            <div className="findings-heading">
              <div>
                <p className="eyebrow">INVESTIGATION GUIDANCE</p>
                <h2>Findings & Next Actions</h2>
                <p className="page-description">
                  Preliminary checks to help guide the investigation.
                </p>
              </div>

              <span className="demo-badge">NOT AI-GENERATED</span>
            </div>

            <div className="finding-item">
              <span className="finding-number">01</span>
              <div>
                <h3>Dimensional deviation identified</h3>
                <p>
                  The illustrative inspection record shows a measurement of 25.8
                  mm against an expected value of 25.0 mm.
                </p>
                <span className="finding-tag">OBSERVATION · SIMULATED DATA</span>
              </div>
            </div>

            <div className="finding-item">
              <span className="finding-number">02</span>
              <div>
                <h3>Verify the measurement</h3>
                <p>
                  Check the inspection instrument, measurement method, and
                  product specification before confirming the deviation.
                </p>
                <span className="finding-tag">SUGGESTED CHECK</span>
              </div>
            </div>

            <div className="finding-item">
              <span className="finding-number">03</span>
              <div>
                <h3>Review the machine calibration</h3>
                <p>
                  Verify the CNC-07 calibration record and obtain the relevant
                  maintenance history before drawing conclusions.
                </p>
                <span className="finding-tag">SUGGESTED CHECK</span>
              </div>
            </div>

            <div className="findings-warning">
              <span>ⓘ</span>
              <p>
                These are preliminary investigation prompts, not confirmed root
                causes. A qualified engineer should verify the evidence and
                determine any necessary corrective action.
              </p>
            </div>
          </section>

          <section className="detail-card checklist-section">
            <div className="checklist-heading">
              <div>
                <p className="eyebrow">OPERATOR WORKFLOW</p>
                <h2>Investigation Checklist</h2>
                <p className="page-description">
                  Track the progress of the investigation tasks.
                </p>
              </div>

              <span className="demo-badge">DEMO CHECKLIST</span>
            </div>

            <div className="checklist-progress">
              <div className="progress-labels">
                <span>Checklist progress</span>
                <strong>
                  {completedCount} of {investigationTasks.length} completed
                </strong>
              </div>

              <div
                className="progress-track"
                role="progressbar"
                aria-label="Investigation checklist progress"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="progress-percentage">{progress}% complete</p>
            </div>

            <div className="checklist-items">
              {investigationTasks.map((task) => {
                const isCompleted = completedTasks.includes(task.id)

                return (
                  <label
                    key={task.id}
                    className={`checklist-item ${
                      isCompleted ? 'task-completed' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => toggleTask(task.id)}
                    />

                    <span className="custom-checkbox">
                      {isCompleted ? '✓' : ''}
                    </span>

                    <span className="checklist-task-content">
                      <strong>{task.title}</strong>
                      <span>{task.description}</span>
                    </span>

                    <span
                      className={`task-status ${
                        isCompleted ? 'status-complete' : ''
                      }`}
                    >
                      {isCompleted ? 'COMPLETED' : 'PENDING'}
                    </span>
                  </label>
                )
              })}
            </div>

            <p className="checklist-disclaimer">
              Demo only: checking a task records the operator's selection in the
              current page session. It does not independently verify that the
              task was performed, and progress is not yet saved to a backend.
            </p>
          </section>

          <p className="page-footer">
            Demonstration data only. No live machinery is connected.
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">A</div>
          <div>
            <h2>AEGIS</h2>
            <p>INDUSTRIAL INTELLIGENCE</p>
          </div>
        </div>

        <p className="nav-heading">WORKSPACE</p>

        <nav>
          <a className="nav-link active" href="#overview">
            <span>▦</span> Operations Overview
          </a>

          <a className="nav-link" href="#incidents">
            <span>◈</span> Incidents
          </a>

          <a className="nav-link" href="#investigation">
            <span>⌕</span> Investigations
          </a>

          <a className="nav-link" href="#actions">
            <span>✓</span> Containment Actions
          </a>

          <a className="nav-link" href="#audit">
            <span>≡</span> Audit & Reports
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="status-dot"></span>
            <div>
              <strong>System Operational</strong>
              <p>Demo environment</p>
            </div>
          </div>
          <p className="sidebar-footer">AEGIS · HACKATHON BUILD</p>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> Operations
          </div>
          <div className="topbar-right">
            <span className="demo-badge">SIMULATION MODE</span>
            <div className="avatar">NF</div>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <p className="eyebrow">INDUSTRIAL OPERATIONS CENTER</p>
            <h1>Operations Overview</h1>
            <p className="page-description">
              Monitor quality incidents, investigate evidence, and coordinate
              containment actions.
            </p>
          </div>
          <button
            className="refresh-button"
            onClick={() => window.location.reload()}
          >
            ↻ Refresh
          </button>
        </section>

        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-top">
              <span>Total Incidents</span>
              <span className="metric-icon blue">▦</span>
            </div>
            <h2>{totalIncidents}</h2>
            <p className="metric-note">Across simulated operations</p>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span>Critical Incidents</span>
              <span className="metric-icon red">!</span>
            </div>
            <h2>{criticalIncidents.toString().padStart(2, '0')}</h2>
            <p className="metric-note">Require priority review</p>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span>Under Investigation</span>
              <span className="metric-icon amber">⌕</span>
            </div>
            <h2>{incidentsUnderInvestigation.toString().padStart(2, '0')}</h2>
            <p className="metric-note">Awaiting evidence analysis</p>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span>Pending Approval</span>
              <span className="metric-icon purple">✓</span>
            </div>
            <h2>{pendingActions.toString().padStart(2, '0')}</h2>
            <p className="metric-note">Human review required</p>
          </div>
        </section>

        <section className="incident-section" id="incidents">
          <div className="section-heading">
            <div>
              <h2>Recent Quality Incidents</h2>
              <p>Review and prioritize simulated production incidents.</p>
            </div>
            <div className="filter-controls">
              <label className="search-control">
                <span>Search incidents</span>
                <input
                  type="search"
                  placeholder="Search ID, product, machine..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>

              <label>
                <span>Severity</span>
                <select
                  value={severityFilter}
                  onChange={(event) => setSeverityFilter(event.target.value)}
                >
                  <option value="All">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                </select>
              </label>

              <label>
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Under Investigation">
                    Under Investigation
                  </option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Monitoring">Monitoring</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </label>

              <button
                className="filter-button"
                onClick={() => {
                  setSeverityFilter('All')
                  setStatusFilter('All')
                  setSearchQuery('')
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>INCIDENT</th>
                  <th>PRODUCT / MACHINE</th>
                  <th>SEVERITY</th>
                  <th>STATUS</th>
                  <th>DETECTED</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((incident) => (
                  <tr
                    key={incident.id}
                    className="clickable-row"
                    onClick={() => setSelectedIncident(incident.id)}
                  >
                    <td>
                      <div className="incident-id">{incident.id}</div>
                      <div className="incident-title">{incident.title}</div>
                    </td>
                    <td>
                      <div className="product-name">{incident.product}</div>
                      <div className="machine-name">{incident.machine}</div>
                    </td>
                    <td>
                      <span
                        className={`severity ${incident.severity.toLowerCase()}`}
                      >
                        {incident.severity}
                      </span>
                    </td>
                    <td>
                      <span className="incident-status">
                        <span className="status-dot"></span>
                        {incident.status}
                      </span>
                    </td>
                    <td className="time-cell">{incident.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>
              Showing {filteredIncidents.length} of {incidents.length} sample
              incidents
            </span>

            <span>All records are simulated for demonstration.</span>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="info-card" id="investigation">
            <div className="info-icon">⌕</div>
            <div>
              <h3>Evidence-led Investigation</h3>
              <p>
                Review inspection results, machine logs, and sensor readings
                before drawing conclusions.
              </p>
              <span className="feature-label">INVESTIGATION WORKSPACE</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon amber-icon">✓</div>
            <div>
              <h3>Human-approved Actions</h3>
              <p>
                Containment actions must be reviewed by a human before approval
                or execution.
              </p>
              <span className="feature-label">HUMAN OVERSIGHT</span>
            </div>
          </div>
        </section>

        <section className="containment-section" id="actions">
          <div className="section-heading">
            <div>
              <p className="eyebrow">HUMAN REVIEW WORKSPACE</p>
              <h2>Containment Actions</h2>
              <p>
                Review proposed actions and record a demonstration approval
                decision.
              </p>
            </div>

            <span className="demo-badge">SIMULATED WORKFLOW</span>
          </div>

          <div className="action-summary-grid">
            <div className="action-summary-card">
              <span>Pending Approval</span>
              <strong>{pendingActions}</strong>
            </div>

            <div className="action-summary-card">
              <span>Approved</span>
              <strong>{approvedActions}</strong>
            </div>

            <div className="action-summary-card">
              <span>Rejected</span>
              <strong>{rejectedActions}</strong>
            </div>
          </div>

          <div className="containment-list">
            {containmentActions.map((action) => (
              <article className="containment-card" key={action.id}>
                <div className="containment-card-header">
                  <span className="action-incident-id">
                    {action.incidentId}
                  </span>

                  <span
                    className={`action-priority ${action.priority.toLowerCase()}`}
                  >
                    {action.priority}
                  </span>
                </div>

                <h3>{action.title}</h3>

                <p className="containment-description">
                  {action.description}
                </p>

                <div className="containment-status-row">
                  <span>Approval status</span>

                  <strong
                    className={`action-status ${action.status
                      .toLowerCase()
                      .replaceAll(' ', '-')}`}
                  >
                    {action.status}
                  </strong>
                </div>

                {action.status === 'Pending Approval' && (
                  <div className="containment-buttons">
                    <button
                      className="approve-button"
                      onClick={() => updateActionStatus(action.id, 'Approved')}
                    >
                      ✓ Approve
                    </button>

                    <button
                      className="reject-button"
                      onClick={() => updateActionStatus(action.id, 'Rejected')}
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}

                {action.status === 'Approved' && (
                  <div className="containment-buttons">
                    <button
                      className="approve-button"
                      onClick={() => updateActionStatus(action.id, 'Executed')}
                    >
                      ▶ Execute Simulated Action
                    </button>

                    <button
                      className="reset-action-button"
                      onClick={() =>
                        updateActionStatus(action.id, 'Pending Approval')
                      }
                    >
                      Return to Pending
                    </button>
                  </div>
                )}

                {action.status === 'Rejected' && (
                  <button
                    className="reset-action-button"
                    onClick={() =>
                      updateActionStatus(action.id, 'Pending Approval')
                    }
                  >
                    Return to Pending
                  </button>
                )}

                {action.status === 'Executed' && (
                  <p className="containment-disclaimer">
                    ✓ Simulated execution completed. No real machinery was
                    changed.
                  </p>
                )}
              </article>
            ))}
          </div>

          <p className="containment-disclaimer">
            Demonstration only. Approval records a simulated decision in the
            current page session. It does not authorize or execute real
            industrial actions, and the decision is not saved to a backend.
          </p>
        </section>

        <section className="audit-section" id="audit">
          <div className="section-heading">
            <div>
              <p className="eyebrow">TRACEABILITY & DOCUMENTATION</p>
              <h2>Audit & Reports</h2>
              <p>Review incident records and prepare a demonstration report.</p>
            </div>
            <span className="demo-badge">SIMULATED RECORDS</span>
          </div>

          <div className="audit-summary-grid">
            <div className="audit-summary-card">
              <span>Total Sample Incidents</span>
              <strong>03</strong>
              <p>Records displayed in this prototype</p>
            </div>

            <div className="audit-summary-card">
              <span>Critical Sample Incidents</span>
              <strong>01</strong>
              <p>Requires priority review in the demo</p>
            </div>

            <div className="audit-summary-card">
              <span>Evidence Records</span>
              <strong>03</strong>
              <p>Illustrative records for INC-001</p>
            </div>
          </div>

          <div className="audit-record-card">
            <div className="audit-record-heading">
              <div>
                <h3>Action Audit Trail</h3>
                <p>A history of approval decisions and simulated executions.</p>
              </div>

              <span className="demo-badge">SESSION HISTORY</span>
            </div>

            {auditEntries.length === 0 ? (
              <p className="containment-disclaimer">
                No action events recorded yet. Approve, reject, or execute an
                action to create an audit entry.
              </p>
            ) : (
              auditEntries.map((entry) => (
                <div className="audit-record-row" key={entry.id}>
                  <div>
                    <strong>{entry.event}</strong>
                    <p>{entry.actionTitle}</p>
                    <p>Incident: {entry.incidentId}</p>
                  </div>

                  <span>{entry.timestamp}</span>
                </div>
              ))
            )}

            <div className="audit-disclaimer">
              This audit trail is held in browser memory and will be lost when
              the application reloads. Persistent storage and authenticated user
              identities are not implemented yet.
            </div>
          </div>

          <div className="audit-record-card">
            <div className="audit-record-heading">
              <div>
                <h3>Incident Record Summary</h3>
                <p>Example record for demonstration purposes.</p>
              </div>
              <span className="demo-badge">INC-001</span>
            </div>

            <div className="audit-record-row">
              <span>Incident</span>
              <strong>Dimensional Deviation</strong>
            </div>

            <div className="audit-record-row">
              <span>Product</span>
              <strong>Precision Housing</strong>
            </div>

            <div className="audit-record-row">
              <span>Machine</span>
              <strong>CNC-07</strong>
            </div>

            <div className="audit-record-row">
              <span>Investigation status</span>
              <strong>
                {incidents.find((incident) => incident.id === 'INC-001')
                  ?.status ?? 'Unknown'}
              </strong>
            </div>

            <div className="audit-record-row">
              <span>Evidence status</span>
              <strong>Requires Verification</strong>
            </div>

            <div className="audit-disclaimer">
              These are illustrative records. They are not connected to a live
              factory system and do not establish a confirmed root cause.
            </div>
          </div>

          <div className="audit-export-row">
            <div>
              <h3>Export Demonstration Report</h3>
              <p>
                Download a text report containing the sample incident details.
              </p>
            </div>

            <button
              className="export-button"
              onClick={() => {
                const report = [
                  'AEGIS - INDUSTRIAL QUALITY INCIDENT REPORT',
                  'DEMONSTRATION REPORT - SIMULATED DATA ONLY',
                  '',
                  'Incident ID: INC-001',
                  'Incident: Dimensional Deviation',
                  'Product: Precision Housing',
                  'Machine: CNC-07',
                  'Severity: Critical',
                  `Status: ${
                    incidents.find((incident) => incident.id === 'INC-001')
                      ?.status ?? 'Unknown'
                  }`,
                  '',
                  'Illustrative inspection data:',
                  'Expected dimension: 25.0 mm',
                  'Measured dimension: 25.8 mm',
                  'Difference: +0.8 mm',
                  '',
                  'Verification required:',
                  '- Verify the dimensional measurement.',
                  '- Review the product specification and tolerance.',
                  '- Check CNC-07 calibration records.',
                  '- Document verified investigation evidence.',
                  '',
                  'No root cause has been established.',
                  'This report contains simulated demonstration data.',
                  'It is not a verified industrial or engineering report.',
                ].join('\n')

                const file = new Blob([report], {
                  type: 'text/plain;charset=utf-8',
                })

                const url = URL.createObjectURL(file)
                const link = document.createElement('a')

                link.href = url
                link.download = 'AEGIS-INC-001-Demo-Report.txt'
                link.click()

                URL.revokeObjectURL(url)
              }}
            >
              ↓ Download Report
            </button>
          </div>
        </section>

        <footer className="page-footer">
          <span>AEGIS Industrial Quality Incident Commander</span>
          <span>Prototype · Simulated data · Not connected to live machinery</span>
        </footer>
      </main>
    </div>
  )
}

export default App
