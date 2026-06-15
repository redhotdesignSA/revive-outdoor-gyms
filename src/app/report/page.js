'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const MOCK_GYMS = [
  { id: '1', name: 'Summerstrand Beachfront Gym', machines: ['Double Stepper', 'Air Walker', 'Chest Press', 'Waist Twister'] },
  { id: '2', name: 'Greenacres Park Gym', machines: ['Leg Press', 'Pull Up Bars', 'Back Extension'] },
  { id: '3', name: 'Walmer Township Gym', machines: ['Stepper', 'Shoulder Press', 'Sit Up Bench', 'Twister', 'Leg Raise'] },
]

const ISSUE_TYPES = [
  { value: 'broken', label: 'Broken / not working' },
  { value: 'unsafe', label: 'Unsafe / injury risk' },
  { value: 'worn', label: 'Worn / deteriorating' },
  { value: 'missing', label: 'Missing parts' },
  { value: 'vandalism', label: 'Vandalism / graffiti' },
  { value: 'other', label: 'Other' },
]

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', desc: 'Cosmetic issue, still usable' },
  { value: 'medium', label: 'Medium', desc: 'Partly usable, needs attention' },
  { value: 'high', label: 'High', desc: 'Unusable or potentially unsafe' },
]

export default function ReportPage() {
  const searchParams = useSearchParams()
  const preselectedGymId = searchParams.get('gym') || ''

  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    gym_id: preselectedGymId,
    machine: '',
    issue_type: '',
    severity: '',
    notes: '',
    reporter_name: '',
    reporter_email: '',
  })

  const selectedGym = MOCK_GYMS.find(g => g.id === form.gym_id)

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const canProceedStep1 = form.gym_id && form.machine && form.issue_type && form.severity
  const canProceedStep2 = form.notes.length >= 10

  const handleSubmit = () => {
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Report submitted</h2>
        <p style={{ color: '#6B7280', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
          Thank you for helping keep our outdoor gyms accountable. Your report has been logged and will be reviewed.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link href="/map" style={{
            background: '#2D6A4F', color: 'white',
            padding: '12px 24px', borderRadius: '25px',
            textDecoration: 'none', fontWeight: 700, fontSize: '15px'
          }}>Back to the map</Link>
          <button onClick={() => { setSubmitted(false); setForm({ gym_id: '', machine: '', issue_type: '', severity: '', notes: '', reporter_name: '', reporter_email: '' }); setStep(1) }}
            style={{
              background: 'none', border: '2px solid #E5E7EB',
              padding: '12px 24px', borderRadius: '25px',
              cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: '#374151'
            }}>Report another issue</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 0 3rem' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <Link href="/map" style={{ color: '#2D6A4F', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
          ← Back to map
        </Link>
      </div>

      {/* Progress */}
      <div style={{ padding: '16px', background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>Report an issue</h1>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              background: s <= step ? '#2D6A4F' : '#E5E7EB',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
          Step {step} of 3
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Step 1 */}
        {step === 1 && (
          <>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                Which gym?
              </label>
              <select
                value={form.gym_id}
                onChange={e => { update('gym_id', e.target.value); update('machine', '') }}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1.5px solid #D1D5DB', fontSize: '15px',
                  background: 'white', appearance: 'auto'
                }}
              >
                <option value="">Select a gym...</option>
                {MOCK_GYMS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            {selectedGym && (
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                  Which machine?
                </label>
                <select
                  value={form.machine}
                  onChange={e => update('machine', e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1.5px solid #D1D5DB', fontSize: '15px',
                    background: 'white', appearance: 'auto'
                  }}
                >
                  <option value="">Select equipment...</option>
                  {selectedGym.machines.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>
                What type of issue?
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ISSUE_TYPES.map(opt => (
                  <label key={opt.value} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '8px',
                    border: `1.5px solid ${form.issue_type === opt.value ? '#2D6A4F' : '#E5E7EB'}`,
                    background: form.issue_type === opt.value ? '#F0FDF4' : 'white',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="issue_type"
                      value={opt.value}
                      checked={form.issue_type === opt.value}
                      onChange={() => update('issue_type', opt.value)}
                      style={{ accentColor: '#2D6A4F' }}
                    />
                    <span style={{ fontSize: '14px' }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>
                How severe?
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {SEVERITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update('severity', opt.value)}
                    style={{
                      flex: 1, padding: '10px 6px', borderRadius: '8px',
                      border: `1.5px solid ${form.severity === opt.value ? '#2D6A4F' : '#E5E7EB'}`,
                      background: form.severity === opt.value ? '#F0FDF4' : 'white',
                      cursor: 'pointer', textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13px', color: form.severity === opt.value ? '#2D6A4F' : '#374151' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', lineHeight: 1.3 }}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => canProceedStep1 && setStep(2)}
              disabled={!canProceedStep1}
              style={{
                width: '100%', padding: '14px',
                background: canProceedStep1 ? '#2D6A4F' : '#D1D5DB',
                color: 'white', border: 'none', borderRadius: '25px',
                fontSize: '15px', fontWeight: 700, cursor: canProceedStep1 ? 'pointer' : 'not-allowed'
              }}
            >
              Next →
            </button>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div style={{
              background: '#F0FDF4', borderRadius: '10px', padding: '12px 14px',
              fontSize: '13px', color: '#2D6A4F'
            }}>
              <strong>{selectedGym?.name}</strong> · {form.machine} · {form.issue_type}
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                Describe the problem <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(required)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
                placeholder="Describe what you see — the more detail, the better. What is broken? Is it a safety risk?"
                rows={5}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1.5px solid #D1D5DB', fontSize: '14px',
                  resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5
                }}
              />
              <div style={{ fontSize: '12px', color: form.notes.length >= 10 ? '#2D6A4F' : '#9CA3AF', marginTop: '4px' }}>
                {form.notes.length} characters {form.notes.length < 10 ? `(${10 - form.notes.length} more needed)` : '✓'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '14px', background: 'white',
                border: '2px solid #E5E7EB', borderRadius: '25px',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer', color: '#374151'
              }}>← Back</button>
              <button
                onClick={() => canProceedStep2 && setStep(3)}
                disabled={!canProceedStep2}
                style={{
                  flex: 2, padding: '14px',
                  background: canProceedStep2 ? '#2D6A4F' : '#D1D5DB',
                  color: 'white', border: 'none', borderRadius: '25px',
                  fontSize: '15px', fontWeight: 700, cursor: canProceedStep2 ? 'pointer' : 'not-allowed'
                }}
              >Next →</button>
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <div style={{
              background: '#F0FDF4', borderRadius: '10px', padding: '12px 14px',
              fontSize: '13px', color: '#2D6A4F'
            }}>
              <strong>{selectedGym?.name}</strong> · {form.machine}<br />
              <span style={{ opacity: 0.8 }}>{form.notes.substring(0, 60)}{form.notes.length > 60 ? '...' : ''}</span>
            </div>

            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>
              Optional — leave your name and email if you'd like to be notified when this issue is resolved.
            </p>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                Your name (optional)
              </label>
              <input
                type="text"
                value={form.reporter_name}
                onChange={e => update('reporter_name', e.target.value)}
                placeholder="e.g. Norman"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1.5px solid #D1D5DB', fontSize: '15px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                Email address (optional)
              </label>
              <input
                type="email"
                value={form.reporter_email}
                onChange={e => update('reporter_email', e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1.5px solid #D1D5DB', fontSize: '15px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(2)} style={{
                flex: 1, padding: '14px', background: 'white',
                border: '2px solid #E5E7EB', borderRadius: '25px',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer', color: '#374151'
              }}>← Back</button>
              <button onClick={handleSubmit} style={{
                flex: 2, padding: '14px',
                background: '#E76F51',
                color: 'white', border: 'none', borderRadius: '25px',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer'
              }}>Submit report ✓</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
