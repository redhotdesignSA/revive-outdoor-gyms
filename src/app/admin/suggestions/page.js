'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }

      const { data } = await supabase
        .from('gym_suggestions')
        .select('*')
        .order('created_at', { ascending: false })

      setSuggestions(data || [])
      setLoading(false)
    }
    init()
  }, [router])

  const updateStatus = async (id, status) => {
    const supabase = createClient()
    await supabase.from('gym_suggestions').update({ status }).eq('id', id)
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>Loading...</div>

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 0 3rem' }}>
      <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <Link href="/admin" style={{ color: '#2D6A4F', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Admin</Link>
      </div>

      <div style={{ padding: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Gym suggestions ({suggestions.length})</h1>

        {suggestions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>No gym suggestions yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {suggestions.map(s => (
              <div key={s.id} style={{
                background: 'white', borderRadius: '12px', padding: '16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                borderLeft: `3px solid ${s.status === 'pending' ? '#F4A261' : s.status === 'approved' ? '#2D6A4F' : '#9CA3AF'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{s.name}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                      {s.suburb}{s.municipality && ` · ${s.municipality}`}
                    </div>
                    {s.latitude && (
                      <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                        📍 {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                    background: s.status === 'pending' ? '#FEF3C7' : s.status === 'approved' ? '#D8F3DC' : '#F3F4F6',
                    color: s.status === 'pending' ? '#92400E' : s.status === 'approved' ? '#2D6A4F' : '#6B7280'
                  }}>{s.status}</span>
                </div>

                {s.notes && <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '10px' }}>{s.notes}</p>}

                {(s.submitter_name || s.submitter_email) && (
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '10px' }}>
                    By {s.submitter_name || 'Anonymous'} {s.submitter_email && `· ${s.submitter_email}`}
                    {s.submitter_phone && ` · ${s.submitter_phone}`}
                  </div>
                )}

                {s.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href={`/admin/gyms/new?from_suggestion=${s.id}&name=${encodeURIComponent(s.name)}&suburb=${encodeURIComponent(s.suburb || '')}&lat=${s.latitude || ''}&lng=${s.longitude || ''}`} style={{
                      flex: 2, padding: '8px', background: '#2D6A4F', color: 'white',
                      borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', textAlign: 'center'
                    }}>+ Add as gym</Link>
                    <button onClick={() => updateStatus(s.id, 'rejected')} style={{
                      flex: 1, padding: '8px', background: '#F3F4F6', color: '#6B7280',
                      border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                    }}>Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}