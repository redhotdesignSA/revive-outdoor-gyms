'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

const MOCK_GYMS = [
  {
    id: '1',
    name: 'Summerstrand Beachfront Gym',
    suburb: 'Summerstrand',
    municipality: 'Nelson Mandela Bay',
    latitude: -33.9735,
    longitude: 25.6510,
    overall_status: 'needs_maintenance',
    machine_count: 4,
    broken_count: 2,
  },
  {
    id: '2',
    name: 'Greenacres Park Gym',
    suburb: 'Greenacres',
    municipality: 'Nelson Mandela Bay',
    latitude: -33.9580,
    longitude: 25.5720,
    overall_status: 'good',
    machine_count: 6,
    broken_count: 0,
  },
  {
    id: '3',
    name: 'Walmer Township Gym',
    suburb: 'Walmer',
    municipality: 'Nelson Mandela Bay',
    latitude: -33.9820,
    longitude: 25.5490,
    overall_status: 'critical',
    machine_count: 5,
    broken_count: 4,
  },
]

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (mapInstanceRef.current) return

    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current).setView([-33.9600, 25.6000], 12)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      MOCK_GYMS.forEach((gym) => {
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
            <div style="color:#6B7280;font-size:12px;margin:4px 0">${gym.suburb}</div>
            <div style="margin:8px 0">
              <span style="background:${colour};color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">
                ${STATUS_LABELS[gym.overall_status]}
              </span>
            </div>
            <div style="font-size:12px;color:#374151;margin-bottom:10px">
              ${gym.broken_count} of ${gym.machine_count} machines need attention
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
  }, [])

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

      <div ref={mapRef} style={{ flex: 1, width: '100%' }} />

      <div style={{
        background: 'white',
        borderTop: '1px solid #E5E7EB',
        maxHeight: '220px',
        overflowY: 'auto'
      }}>
        {MOCK_GYMS.map((gym) => (
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
              background: STATUS_COLOURS[gym.overall_status],
              flexShrink: 0,
              marginRight: '12px'
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{gym.name}</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>{gym.suburb} · {gym.broken_count} issues</div>
            </div>
            <span style={{ color: '#9CA3AF', fontSize: '18px' }}>›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}