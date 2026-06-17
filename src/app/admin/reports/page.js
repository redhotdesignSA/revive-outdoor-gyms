'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SEVERITY_COLOURS = {
  high: { bg: '#FEE2E2', color: '#991B1B' },
  medium: { bg: '#FEF3C7', color: '#92400E' },
  low: { bg: '#F3F4F6', color: '#6B7280' },
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }
      await loadReports(supabase)
      setLoading(false)
    }
    init()
  }, [router])

  const loadReports = async (supabaseClient) => {
    const supabase = supabaseClient || createClient()
    const { data } = await supabase
      .from('reports')
      .select('*, gym_sites(name, suburb)')
      .order('created_at', { ascending: false })
    setReports(data || [])
  }

  const updateStatus = async (reportId, status) => {
    const supabase = createClient()
    await supabase.from('reports').update({ moderation_status: status }).eq('id', reportId)
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, moderation_status: status } : r))
  }

  const filtered = filter === 'all' ? reports : reports.filter(r => r.moderation_status === filter)

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>Loading...</div>

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 0 3rem' }}>
      <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <Link href="/admin" style={{ color: '#2D6A4F', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Admin</Link>
      </div>

      <div style={{ padding: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Reports</h1>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: 'none',
              background: filter === f ? '#2D6A4F' : '#F3F4F6',
              color: filter === f ? 'white' : '#6B7280',
            }}>{f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${reports.length})` : `(${reports.filter(r => r.moderation_status === f).length})`}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>No {filter} reports.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(report => {
              const sev = SEVERITY_COLOURS[report.severity] || SEVERITY_COLOURS.low
              return (
                <div key={report.id} style={{
                  background: 'white', borderRadius: '12px', padding: '16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  borderLeft: `3px solid ${report.moderation_status === 'pending' ? '#F4A261' : report.moderation_status === 'approved' ? '#2D6A4F' : '#9CA3AF'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>
                        {report.issue_type}
                        <span style={{
                          marginLeft: '8px', padding: '2px 8px', borderRadius: '8px',
                          fontSize: '11px', fontWeight: 600, background: sev.bg, color: sev.color
                        }}>{report.severity}</span>
                      </div>
                      {report.gym_sites && (
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                          {report.gym_sites.name} · {report.gym_sites.suburb}
                        </div>
                      )}
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                      background: report.moderation_status === 'pending' ? '#FEF3C7' :
                                  report.moderation_status === 'approved' ? '#D8F3DC' : '#F3F4F6',
                      color: report.moderation_status === 'pending' ? '#92400E' :
                             report.moderation_status === 'approved' ? '#2D6A4F' : '#6B7280'
                    }}>{report.moderation_status}</span>
                  </div>

                  <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.5, marginBottom: '10px' }}>{report.notes}</p>

                  {report.reporter_name && (
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '10px' }}>
                      By {report.reporter_name} {report.reporter_email && `· ${report.reporter_email}`}
                    </div>
                  )}

                  {report.moderation_status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => updateStatus(report.id, 'approved')} style={{
                        flex: 1, padding: '8px', background: '#D8F3DC', color: '#2D6A4F',
                        border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                      }}>✓ Approve</button>
                      <button onClick={() => updateStatus(report.id, 'rejected')} style={{
                        flex: 1, padding: '8px', background: '#F3F4F6', color: '#6B7280',
                        border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                      }}>✗ Reject</button>
                      {report.gym_sites && (
                        <Link href={`/admin/gyms/${report.gym_site_id}`} style={{
                          flex: 1, padding: '8px', background: '#EFF6FF', color: '#1D4ED8',
                          borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                          textAlign: 'center'
                        }}>View gym</Link>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}