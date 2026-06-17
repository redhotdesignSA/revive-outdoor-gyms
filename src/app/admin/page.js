'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ gyms: 0, reports: 0, pending: 0, suggestions: 0 })
  const [recentReports, setRecentReports] = useState([])
  const [recentSuggestions, setRecentSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/admin/login')
        return
      }
      setUser(user)

      const [gymsRes, reportsRes, suggestionsRes] = await Promise.all([
        supabase.from('gym_sites').select('id', { count: 'exact' }),
        supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('gym_suggestions').select('*').order('created_at', { ascending: false }).limit(5),
      ])

      const pendingRes = await supabase
        .from('reports')
        .select('id', { count: 'exact' })
        .eq('moderation_status', 'pending')

      setStats({
        gyms: gymsRes.count || 0,
        reports: reportsRes.data?.length || 0,
        pending: pendingRes.count || 0,
        suggestions: suggestionsRes.data?.length || 0,
      })
      setRecentReports(reportsRes.data || [])
      setRecentSuggestions(suggestionsRes.data || [])
      setLoading(false)
    }
    init()
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>Loading...</div>
  )

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 1rem 3rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Admin Dashboard</h1>
          <div style={{ fontSize: '13px', color: '#6B7280' }}>{user?.email}</div>
        </div>
        <button onClick={handleSignOut} style={{
          background: 'none', border: '1.5px solid #E5E7EB',
          padding: '8px 16px', borderRadius: '20px',
          fontSize: '13px', cursor: 'pointer', color: '#374151'
        }}>Sign out</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Gyms on map', value: stats.gyms, color: '#2D6A4F', link: '/admin/gyms' },
          { label: 'Pending reports', value: stats.pending, color: '#E76F51', link: '/admin/reports' },
          { label: 'Gym suggestions', value: stats.suggestions, color: '#F4A261', link: '/admin/suggestions' },
          { label: 'Total reports', value: stats.reports, color: '#6B7280', link: '/admin/reports' },
        ].map((stat, i) => (
          <Link key={i} href={stat.link} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white', borderRadius: '12px', padding: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link href="/admin/gyms/new" style={{
          background: '#2D6A4F', color: 'white',
          padding: '10px 20px', borderRadius: '20px',
          textDecoration: 'none', fontWeight: 600, fontSize: '14px'
        }}>+ Add new gym</Link>
        <Link href="/admin/reports" style={{
          background: '#E76F51', color: 'white',
          padding: '10px 20px', borderRadius: '20px',
          textDecoration: 'none', fontWeight: 600, fontSize: '14px'
        }}>Review reports</Link>
        <Link href="/admin/suggestions" style={{
          background: '#F4A261', color: 'white',
          padding: '10px 20px', borderRadius: '20px',
          textDecoration: 'none', fontWeight: 600, fontSize: '14px'
        }}>Gym suggestions</Link>
        <Link href="/admin/gyms" style={{
          background: 'white', color: '#374151',
          padding: '10px 20px', borderRadius: '20px',
          textDecoration: 'none', fontWeight: 600, fontSize: '14px',
          border: '1.5px solid #E5E7EB'
        }}>Manage gyms</Link>
      </div>

      {/* Recent reports */}
      {recentReports.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px' }}>Recent reports</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentReports.map(report => (
              <div key={report.id} style={{
                background: 'white', borderRadius: '10px', padding: '12px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{report.issue_type} — {report.severity}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{report.notes?.substring(0, 60)}...</div>
                </div>
                <span style={{
                  background: report.moderation_status === 'pending' ? '#FEF3C7' : '#D8F3DC',
                  color: report.moderation_status === 'pending' ? '#92400E' : '#2D6A4F',
                  padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600
                }}>{report.moderation_status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent suggestions */}
      {recentSuggestions.length > 0 && (
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px' }}>Recent gym suggestions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentSuggestions.map(s => (
              <div key={s.id} style={{
                background: 'white', borderRadius: '10px', padding: '12px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{s.name}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{s.suburb} · {s.submitter_email || 'Anonymous'}</div>
                </div>
                <span style={{
                  background: '#FEF3C7', color: '#92400E',
                  padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600
                }}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}