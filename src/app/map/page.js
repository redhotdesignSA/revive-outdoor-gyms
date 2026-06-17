'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
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

export default function MapPage() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [gyms, setGyms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGyms = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('gym_sites')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching gyms:', error)
      } else {
        setGyms(data || [])
      }
      setLoading(false)
    }

    fetchGyms()
  }, [])

  useEffect(() => {
    if (loading) return
    if (typeof window === 'undefined') return
    if (mapInstanceRef.current) return

    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const defaultCenter = gyms.length > 0
        ? [gyms[0].latitude, gyms[0].longitude]
        : [-33.9600, 25.6000]

      const map = L.map(mapRef.current).setView(defaultCenter, 12)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      gyms.forEach((gym) => {
        if (!gym.latitude || !gym.longitude) return
        const colour = STATUS_COLOURS[gym.overall_status] || '#9CA3AF'

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background:${colour};
            width:14px;height:14px;
            border-radius:50%;
            border:3px solid white;
            box-shadow:0 2px 6px rgba(0,0,0,0.35);
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })

        const marker = L.marker([gym.latitude, gym.longitude], { icon }).addTo(map)

        marker.bindPopup(`
          <div style="min-width:180px;font-family:sans-serif">
            <strong style="font-size:14px">${gym.name}</strong>
            <div style="color:#6B7280;font-size:12px;margin:4px 0">${gym.suburb || ''}</div>
            <div style="margin:8px 0">
              <span style="background:${colour};color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">
                ${STATUS_LABELS[gym.overall_status] || 'Unknown'}
              </span>
            </div>
            <a href="/gyms/${gym.id}" style="
              display:block;text-align:center;
              background:#2D6A4F;color:white;
              padding:6px;border-radius:8px;
              text-decoration:none;font-size:13px;font-weight:600
            ">View gym</a>
          </div>
        `)
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [loading, gyms])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div style={{
        background: 'white',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        borderBottom: '1px solid #E5E7EB',
        flexWrap: 'wrap',
        fontSize: '12px'
      }}>
        <span style={{ fontWeight: 600, color: '#374151' }}>Gym status:</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2D6A4F', display: 'inline-block' }} />
          Good
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F4A261', display: 'inline-block' }} />
          Needs attention
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E76F51', display: 'inline-block' }} />
          Critical
        </span>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
          Loading map...
        </div>
      ) : (
        <div ref={mapRef} style={{ flex: 1, width: '100%' }} />
      )}

      <div style={{
        background: 'white',
        borderTop: '1px solid #E5E7EB',
        maxHeight: '220px',
        overflowY: 'auto'
      }}>
        {loading ? (
          <div style={{ padding: '16px', color: '#6B7280', textAlign: 'center' }}>Loading gyms...</div>
        ) : gyms.length === 0 ? (
          <div style={{ padding: '16px', color: '#6B7280', textAlign: 'center' }}>No gyms added yet.</div>
        ) : (
          gyms.map((gym) => (
            <Link key={gym.id} href={`/gyms/${gym.id}`} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #F3F4F6',
              textDecoration: 'none',
              color: 'inherit'
            }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: STATUS_COLOURS[gym.overall_status] || '#9CA3AF',
                flexShrink: 0,
                marginRight: '12px'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{gym.name}</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>{gym.suburb} · {gym.municipality}</div>
              </div>
              <span style={{ color: '#9CA3AF', fontSize: '18px' }}>›</span>
            </Link>
          ))
        )}

        {/* Suggest a gym CTA */}
        <Link href="/suggest" style={{
          display: 'flex',
          alignItems: 'center',
          padding: '13px 16px',
          textDecoration: 'none',
          color: '#2D6A4F',
          borderTop: '1px solid #E5E7EB',
          background: '#F0FDF4',
        }}>
          <span style={{ fontSize: '16px', marginRight: '10px' }}>📍</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Know a gym not on the map?</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Suggest a gym for us to add</div>
          </div>
          <span style={{ color: '#2D6A4F', fontSize: '18px' }}>›</span>
        </Link>
      </div>
    </div>
  )
}