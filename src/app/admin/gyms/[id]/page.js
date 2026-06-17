'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const STATUS_OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'needs_maintenance', label: 'Needs maintenance' },
  { value: 'critical', label: 'Critical' },
  { value: 'unknown', label: 'Unknown' },
]

const CONDITION_STYLES = {
  good: { bg: '#D8F3DC', color: '#2D6A4F', label: 'Good' },
  worn: { bg: '#FEF3C7', color: '#92400E', label: 'Worn' },
  unsafe: { bg: '#FEE2E2', color: '#991B1B', label: 'Unsafe' },
  broken: { bg: '#FEE2E2', color: '#991B1B', label: 'Broken' },
  unknown: { bg: '#F3F4F6', color: '#6B7280', label: 'Unknown' },
}

export default function AdminGymDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [gym, setGym] = useState(null)
  const [machines, setMachines] = useState([])
  const [photos, setPhotos] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }

      const [gymRes, machinesRes, photosRes, reportsRes] = await Promise.all([
        supabase.from('gym_sites').select('*').eq('id', params.id).single(),
        supabase.from('equipment_units').select('*').eq('gym_site_id', params.id).order('machine_label'),
        supabase.from('photos').select('*').eq('gym_site_id', params.id),
        supabase.from('reports').select('*').eq('gym_site_id', params.id).order('created_at', { ascending: false }),
      ])

      setGym(gymRes.data)
      setMachines(machinesRes.data || [])
      setPhotos(photosRes.data || [])
      setReports(reportsRes.data || [])
      setLoading(false)
    }
    init()
  }, [params.id, router])

  const updateGymStatus = async (status) => {
    const supabase = createClient()
    await supabase.from('gym_sites').update({ overall_status: status }).eq('id', params.id)
    setGym(prev => ({ ...prev, overall_status: status }))
  }

  const updateMachineCondition = async (machineId, field, value) => {
    const supabase = createClient()
    await supabase.from('equipment_units').update({ [field]: value }).eq('id', machineId)
    setMachines(prev => prev.map(m => m.id === machineId ? { ...m, [field]: value } : m))
  }

  const approveReport = async (reportId) => {
    const supabase = createClient()
    await supabase.from('reports').update({ moderation_status: 'approved' }).eq('id', reportId)
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, moderation_status: 'approved' } : r))
  }

  const deleteGym = async () => {
    if (!confirm('Are you sure you want to delete this gym? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('gym_sites').delete().eq('id', params.id)
    router.push('/admin')
  }

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>Loading...</div>
  if (!gym) return <div style={{ padding: '3rem', textAlign: 'center' }}>Gym not found. <Link href="/admin">Back to admin</Link></div>

  const gymPhotos = photos.filter(p => !p.equipment_unit_id)
  const brokenCount = machines.filter(m => m.condition_status === 'broken' || m.condition_status === 'unsafe').length

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 0 3rem' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/admin" style={{ color: '#2D6A4F', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Admin</Link>
        <button onClick={deleteGym} style={{
          background: 'none', border: '1px solid #FCA5A5', color: '#991B1B',
          padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer'
        }}>Delete gym</button>
      </div>

      {/* Gym header */}
      <div style={{ padding: '20px 16px', background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{gym.name}</h1>
        <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>{gym.suburb} · {gym.municipality}</div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Status:</span>
          {STATUS_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => updateGymStatus(opt.value)} style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', border: 'none',
              background: gym.overall_status === opt.value ? '#2D6A4F' : '#F3F4F6',
              color: gym.overall_status === opt.value ? 'white' : '#6B7280',
            }}>{opt.label}</button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          {[
            { label: 'Machines', value: machines.length, color: '#2D6A4F' },
            { label: 'Issues', value: brokenCount, color: brokenCount > 0 ? '#E76F51' : '#2D6A4F' },
            { label: 'Reports', value: reports.length, color: '#374151' },
            { label: 'Photos', value: photos.length, color: '#374151' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: '#F9FAFB', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gym photos */}
      {gymPhotos.length > 0 && (
        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>Gym photos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {gymPhotos.map(photo => (
              <img key={photo.id} src={photo.image_url} alt="" style={{
                width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px'
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Equipment */}
      <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Equipment ({machines.length})</h2>
          <Link href={`/admin/gyms/${params.id}/add-machine`} style={{
            background: '#2D6A4F', color: 'white', padding: '6px 14px',
            borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: 600
          }}>+ Add machine</Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {machines.map(machine => {
            const machinePhotos = photos.filter(p => p.equipment_unit_id === machine.id)
            const cond = CONDITION_STYLES[machine.condition_status] || CONDITION_STYLES.unknown

            return (
              <div key={machine.id} style={{
                background: 'white', borderRadius: '10px', padding: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: machine.safety_flag ? '1px solid #FCA5A5' : '1px solid #F3F4F6'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>
                      {machine.safety_flag && '⚠️ '}{machine.machine_label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                      {machine.usability_status === 'usable' ? 'In use' :
                       machine.usability_status === 'partly_usable' ? 'Partly usable' : 'Out of order'}
                    </div>
                  </div>
                  <span style={{
                    background: cond.bg, color: cond.color,
                    padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600
                  }}>{cond.label}</span>
                </div>

                {/* Quick condition update */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {Object.entries(CONDITION_STYLES).map(([key, style]) => (
                    <button key={key} onClick={() => updateMachineCondition(machine.id, 'condition_status', key)} style={{
                      padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                      cursor: 'pointer', border: 'none',
                      background: machine.condition_status === key ? style.bg : '#F3F4F6',
                      color: machine.condition_status === key ? style.color : '#9CA3AF',
                    }}>{style.label}</button>
                  ))}
                  <button onClick={() => updateMachineCondition(machine.id, 'safety_flag', !machine.safety_flag)} style={{
                    padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                    cursor: 'pointer', border: 'none',
                    background: machine.safety_flag ? '#FEE2E2' : '#F3F4F6',
                    color: machine.safety_flag ? '#991B1B' : '#9CA3AF',
                  }}>⚠️ Safety</button>
                </div>

                {/* Machine photos */}
                {machinePhotos.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px', overflowX: 'auto' }}>
                    {machinePhotos.map(photo => (
                      <img key={photo.id} src={photo.image_url} alt="" style={{
                        width: '72px', height: '72px', objectFit: 'cover',
                        borderRadius: '6px', flexShrink: 0
                      }} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Reports */}
      {reports.length > 0 && (
        <div style={{ padding: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Reports ({reports.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reports.map(report => (
              <div key={report.id} style={{
                background: 'white', borderRadius: '10px', padding: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                borderLeft: report.moderation_status === 'pending' ? '3px solid #F4A261' : '3px solid #2D6A4F'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{report.issue_type} — {report.severity}</div>
                    <div style={{ fontSize: '13px', color: '#4B5563', marginTop: '4px', lineHeight: 1.5 }}>{report.notes}</div>
                    {report.reporter_name && (
                      <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px' }}>
                        By {report.reporter_name} {report.reporter_email && `· ${report.reporter_email}`}
                      </div>
                    )}
                  </div>
                  {report.moderation_status === 'pending' && (
                    <button onClick={() => approveReport(report.id)} style={{
                      background: '#D8F3DC', color: '#2D6A4F', border: 'none',
                      padding: '4px 12px', borderRadius: '10px', fontSize: '12px',
                      fontWeight: 600, cursor: 'pointer', flexShrink: 0, marginLeft: '8px'
                    }}>Approve</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}