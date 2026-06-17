'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_STYLES = {
  good: { bg: '#D8F3DC', color: '#2D6A4F', label: 'Good' },
  needs_maintenance: { bg: '#FEF3C7', color: '#92400E', label: 'Needs attention' },
  critical: { bg: '#FEE2E2', color: '#991B1B', label: 'Critical' },
  unknown: { bg: '#F3F4F6', color: '#6B7280', label: 'Unknown' },
}

export default function AdminGymsListPage() {
  const [gyms, setGyms] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }

      // Fetch gyms with machine count
      const { data: gymsData } = await supabase
        .from('gym_sites')
        .select('*')
        .order('name')

      if (gymsData) {
        // Get machine counts for each gym
        const gymsWithCounts = await Promise.all(
          gymsData.map(async (gym) => {
            const { count: machineCount } = await supabase
              .from('equipment_units')
              .select('*', { count: 'exact', head: true })
              .eq('gym_site_id', gym.id)

            const { count: reportCount } = await supabase
              .from('reports')
              .select('*', { count: 'exact', head: true })
              .eq('gym_site_id', gym.id)
              .eq('moderation_status', 'pending')

            return { ...gym, machine_count: machineCount || 0, pending_reports: reportCount || 0 }
          })
        )
        setGyms(gymsWithCounts)
      }
      setLoading(false)
    }
    init()
  }, [router])

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>Loading gyms...</div>

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 0 3rem' }}>
      <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/admin" style={{ color: '#2D6A4F', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Admin</Link>
        <Link href="/admin/gyms/new" style={{
          background: '#2D6A4F', color: 'white',
          padding: '6px 14px', borderRadius: '20px',
          textDecoration: 'none', fontSize: '13px', fontWeight: 600
        }}>+ Add gym</Link>
      </div>

      <div style={{ padding: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>
          All gyms ({gyms.length})
        </h1>

        {gyms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏋️</div>
            <p>No gyms added yet.</p>
            <Link href="/admin/gyms/new" style={{
              display: 'inline-block', marginTop: '12px',
              background: '#2D6A4F', color: 'white',
              padding: '10px 20px', borderRadius: '20px',
              textDecoration: 'none', fontWeight: 600
            }}>+ Add the first gym</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {gyms.map(gym => {
              const statusStyle = STATUS_STYLES[gym.overall_status] || STATUS_STYLES.unknown
              return (
                <Link
                  key={gym.id}
                  href={`/admin/gyms/${gym.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: 'white', borderRadius: '12px', padding: '16px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    border: gym.pending_reports > 0 ? '1px solid #FCA5A5' : '1px solid #F3F4F6',
                    cursor: 'pointer', transition: 'box-shadow 0.15s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{gym.name}</div>
                        <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                          {gym.suburb}{gym.municipality ? ` · ${gym.municipality}` : ''}
                        </div>
                      </div>
                      <span style={{
                        background: statusStyle.bg, color: statusStyle.color,
                        padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                        flexShrink: 0, marginLeft: '8px'
                      }}>{statusStyle.label}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6B7280' }}>
                      <span>🏋️ {gym.machine_count} machine{gym.machine_count !== 1 ? 's' : ''}</span>
                      {gym.pending_reports > 0 && (
                        <span style={{ color: '#DC2626', fontWeight: 600 }}>
                          ⚠️ {gym.pending_reports} pending report{gym.pending_reports !== 1 ? 's' : ''}
                        </span>
                      )}
                      {gym.latitude && (
                        <span>📍 {gym.latitude.toFixed(3)}, {gym.longitude.toFixed(3)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}