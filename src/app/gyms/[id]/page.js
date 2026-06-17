'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  const [gym, setGym] = useState(null)
  const [machines, setMachines] = useState([])
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGym = async () => {
      const supabase = createClient()

      const { data: gymData, error: gymError } = await supabase
        .from('gym_sites')
        .select('*')
        .eq('id', params.id)
        .single()

      if (gymError) {
        console.error('Error fetching gym:', gymError)
        setLoading(false)
        return
      }

      const { data: machineData } = await supabase
        .from('equipment_units')
        .select('*')
        .eq('gym_site_id', params.id)
        .order('machine_label')

      const { data: timelineData } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('gym_site_id', params.id)
        .order('created_at', { ascending: false })

      setGym(gymData)
      setMachines(machineData || [])
      setTimeline(timelineData || [])
      setLoading(false)
    }

    fetchGym()
  }, [params.id])

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
        Loading gym details...
      </div>
    )
  }

  if (!gym) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Gym not found</h2>
        <Link href="/map">Back to map</Link>
      </div>
    )
  }

  const statusColour = STATUS_COLOURS[gym.overall_status] || '#9CA3AF'
  const brokenCount = machines.filter(m =>
    m.condition_status === 'broken' || m.condition_status === 'unsafe'
  ).length

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 0 3rem' }}>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', background: 'white' }}>
        <Link href="/map" style={{ color: '#2D6A4F', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
          ← Back to map
        </Link>
      </div>

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
            {STATUS_LABELS[gym.overall_status] || 'Unknown'}
          </span>
        </div>

        {gym.public_notes && (
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#4B5563', lineHeight: 1.6 }}>
            {gym.public_notes}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <div style={{ flex: 1, background: '#F9FAFB', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#2D6A4F' }}>{machines.length}</div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>Total machines</div>
          </div>
          <div style={{ flex: 1, background: '#F9FAFB', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: brokenCount > 0 ? '#E76F51' : '#2D6A4F' }}>{brokenCount}</div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>Need attention</div>
          </div>
          <div style={{ flex: 1, background: '#F9FAFB', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#374151' }}>{timeline.length}</div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>Timeline events</div>
          </div>
        </div>
      </div>

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

      {machines.length > 0 && (
        <div style={{ padding: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Equipment</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {machines.map((machine) => {
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
      )}

      {timeline.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {timeline.map((event) => (
              <div key={event.id} style={{
                background: 'white',
                borderRadius: '10px',
                padding: '14px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                borderLeft: '3px solid #E76F51'
              }}>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px' }}>
                  {new Date(event.created_at).toLocaleDateString('en-ZA')}
                </div>
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