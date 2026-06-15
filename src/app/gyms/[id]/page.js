'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

const MOCK_GYMS = {
  '1': {
    id: '1',
    name: 'Summerstrand Beachfront Gym',
    suburb: 'Summerstrand',
    municipality: 'Nelson Mandela Bay',
    province: 'Eastern Cape',
    overall_status: 'needs_maintenance',
    public_notes: 'Popular beachfront gym used daily by residents. Several machines have been damaged.',
    machines: [
      { id: 'm1', machine_label: 'Double Stepper', condition_status: 'worn', usability_status: 'partly_usable', safety_flag: false },
      { id: 'm2', machine_label: 'Air Walker', condition_status: 'unsafe', usability_status: 'unusable', safety_flag: true },
      { id: 'm3', machine_label: 'Chest Press', condition_status: 'broken', usability_status: 'unusable', safety_flag: false },
      { id: 'm4', machine_label: 'Waist Twister', condition_status: 'good', usability_status: 'usable', safety_flag: false },
    ],
    timeline: [
      { date: '2025-06-01', event_type: 'report', title: 'Air walker reported unsafe', description: 'Bolt missing from pivot point.' },
      { date: '2025-05-15', event_type: 'report', title: 'Chest press reported broken', description: 'Resistance mechanism completely failed.' },
    ],
  },
  '2': {
    id: '2',
    name: 'Greenacres Park Gym',
    suburb: 'Greenacres',
    municipality: 'Nelson Mandela Bay',
    province: 'Eastern Cape',
    overall_status: 'good',
    public_notes: 'Well maintained gym in the park. All equipment in working order.',
    machines: [
      { id: 'm5', machine_label: 'Leg Press', condition_status: 'good', usability_status: 'usable', safety_flag: false },
      { id: 'm6', machine_label: 'Pull Up Bars', condition_status: 'good', usability_status: 'usable', safety_flag: false },
      { id: 'm7', machine_label: 'Back Extension', condition_status: 'good', usability_status: 'usable', safety_flag: false },
    ],
    timeline: [],
  },
  '3': {
    id: '3',
    name: 'Walmer Township Gym',
    suburb: 'Walmer',
    municipality: 'Nelson Mandela Bay',
    province: 'Eastern Cape',
    overall_status: 'critical',
    public_notes: 'Gym in urgent need of attention. Most equipment is unusable or unsafe.',
    machines: [
      { id: 'm8', machine_label: 'Stepper', condition_status: 'broken', usability_status: 'unusable', safety_flag: true },
      { id: 'm9', machine_label: 'Shoulder Press', condition_status: 'broken', usability_status: 'unusable', safety_flag: false },
      { id: 'm10', machine_label: 'Sit Up Bench', condition_status: 'unsafe', usability_status: 'unusable', safety_flag: true },
      { id: 'm11', machine_label: 'Twister', condition_status: 'worn', usability_status: 'partly_usable', safety_flag: false },
      { id: 'm12', machine_label: 'Leg Raise', condition_status: 'good', usability_status: 'usable', safety_flag: false },
    ],
    timeline: [
      { date: '2025-06-10', event_type: 'report', title: 'Multiple machines reported broken', description: 'Community member reported 3 machines out of order.' },
    ],
  },
}

const STATUS_COLOURS = {
  good: '#2D6A4F',
  needs_maintenance: '#F4A261',
  critical: '#E76F51',
  unknown: '#9CA3AF',
}

const STATUS_LABELS = {
  good: 'Good',
  needs_maintenance: 'Needs attention',
  critical: 'Critical',
  unknown: 'Unknown',
}

const CONDITION_STYLES = {
  good: { bg: '#D8F3DC', color: '#2D6A4F', label: 'Good' },
  worn: { bg: '#FEF3C7', color: '#92400E', label: 'Worn' },
  unsafe: { bg: '#FEE2E2', color: '#991B1B', label: 'Unsafe' },
  broken: { bg: '#FEE2E2', color: '#991B1B', label: 'Broken' },
  unknown: { bg: '#F3F4F6', color: '#6B7280', label: 'Unknown' },
}

export default function GymDetailPage() {
  const params = useParams()
  const gym = MOCK_GYMS[params.id]

  if (!gym) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Gym not found</h2>
        <Link href="/map">Back to map</Link>
      </div>
    )
  }

  const statusColour = STATUS_COLOURS[gym.overall_status] || '#9CA3AF'
  const brokenCount = gym.machines.filter(m => m.condition_status === 'broken' || m.condition_status === 'unsafe').length

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 0 3rem' }}>

      {/* Back nav */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', background: 'white' }}>
        <Link href="/map" style={{ color: '#2D6A4F', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
          ← Back to map
        </Link>
      </div>

      {/* Gym header */}
      <div style={{ padding: '20px 16px', background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', lineHeight: 1.2 }}>{gym.name}</h1>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>{gym.suburb} · {gym.municipality}</div>
          </div>
          <span style={{
            background: statusColour,
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            flexShrink: 0,
            marginTop: '4px'
          }}>
            {STATUS_LABELS[gym.overall_status]}
          </span>
        </div>

        {gym.public_notes && (
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#4B5563', lineHeight: 1.6 }}>
            {gym.public_notes}
          </p>
        )}

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <div style={{ flex: 1, background: '#F9FAFB', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#2D6A4F' }}>{gym.machines.length}</div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>Total machines</div>
          </div>
          <div style={{ flex: 1, background: '#F9FAFB', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: brokenCount > 0 ? '#E76F51' : '#2D6A4F' }}>{brokenCount}</div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>Need attention</div>
          </div>
          <div style={{ flex: 1, background: '#F9FAFB', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#374151' }}>{gym.timeline.length}</div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>Reports filed</div>
          </div>
        </div>
      </div>

      {/* Report CTA */}
      <div style={{ padding: '12px 16px', background: '#FFF7ED', borderBottom: '1px solid #FED7AA' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', color: '#92400E' }}>See something broken?</span>
          <Link href={`/report?gym=${gym.id}`} style={{
            background: '#E76F51',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 600
          }}>Report it</Link>
        </div>
      </div>

      {/* Machines */}
      <div style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Equipment</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {gym.machines.map((machine) => {
            const cond = CONDITION_STYLES[machine.condition_status] || CONDITION_STYLES.unknown
            return (
              <div key={machine.id} style={{
                background: 'white',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: machine.safety_flag ? '1px solid #FCA5A5' : '1px solid transparent'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>
                    {machine.safety_flag && <span style={{ color: '#E76F51', marginRight: '6px' }}>⚠️</span>}
                    {machine.machine_label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    {machine.usability_status === 'usable' ? 'In use' :
                     machine.usability_status === 'partly_usable' ? 'Partly usable' : 'Out of order'}
                  </div>
                </div>
                <span style={{
                  background: cond.bg,
                  color: cond.color,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>{cond.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Timeline */}
      {gym.timeline.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {gym.timeline.map((event, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: '10px',
                padding: '14px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                borderLeft: '3px solid #E76F51'
              }}>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px' }}>{event.date}</div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{event.title}</div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>{event.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}