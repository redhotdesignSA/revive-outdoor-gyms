'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SuggestGymPage() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [gpsLoading, setGpsLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    suburb: '',
    municipality: 'Nelson Mandela Bay',
    notes: '',
    submitter_name: '',
    submitter_email: '',
    submitter_phone: '',
    latitude: null,
    longitude: null,
  })

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const canProceedStep1 = form.name.length >= 3 && form.suburb.length >= 2
  const canProceedStep2 = true // notes are optional

  // Init Leaflet map on step 2
  useEffect(() => {
    if (step !== 2) return
    if (typeof window === 'undefined') return
    if (mapInstanceRef.current) return

    // Small delay to ensure DOM is ready
    const timer = setTimeout(async () => {
      if (!mapRef.current) return

      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      // Default marker icon fix
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const defaultLat = form.latitude || -33.9608
      const defaultLng = form.longitude || 25.6022

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 14)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // If we already have a location, place marker
      if (form.latitude && form.longitude) {
        const marker = L.marker([form.latitude, form.longitude], { draggable: true }).addTo(map)
        marker.bindPopup('Drag to adjust location').openPopup()
        marker.on('dragend', (e) => {
          const pos = e.target.getLatLng()
          setForm(prev => ({ ...prev, latitude: pos.lat, longitude: pos.lng }))
        })
        markerRef.current = marker
      }

      // Click to place/move marker
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        setForm(prev => ({ ...prev, latitude: lat, longitude: lng }))

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
          marker.bindPopup('Drag to adjust location').openPopup()
          marker.on('dragend', (ev) => {
            const pos = ev.target.getLatLng()
            setForm(prev => ({ ...prev, latitude: pos.lat, longitude: pos.lng }))
          })
          markerRef.current = marker
        }
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [step])

  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Location not available on this device')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setForm(prev => ({ ...prev, latitude: lat, longitude: lng }))
        setGpsLoading(false)

        if (mapInstanceRef.current) {
          const L = window.L || require('leaflet')
          mapInstanceRef.current.setView([lat, lng], 16)

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
          } else {
            import('leaflet').then(({ default: L }) => {
              const marker = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current)
              marker.bindPopup('Your location — tap to adjust').openPopup()
              marker.on('dragend', (e) => {
                const p = e.target.getLatLng()
                setForm(prev => ({ ...prev, latitude: p.lat, longitude: p.lng }))
              })
              markerRef.current = marker
            })
          }
        }
      },
      (err) => {
        console.error('GPS error:', err)
        setGpsLoading(false)
        alert('Could not get location. Try tapping the map instead.')
      },
      { timeout: 10000 }
    )
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.from('gym_suggestions').insert({
  name: form.name,
  suburb: form.suburb,
  municipality: form.municipality || null,
  notes: form.notes || null,
  submitter_name: form.submitter_name || null,
  submitter_email: form.submitter_email || null,
  submitter_phone: form.submitter_phone || null,
  latitude: form.latitude,
  longitude: form.longitude,
  status: 'pending',
})
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      console.error('Submit error:', err)
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>📍</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Suggestion received!</h2>
        <p style={{ color: '#6B7280', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
          Thanks for helping us grow the map. We'll review your suggestion and add the gym once verified.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link href="/map" style={{
            background: '#2D6A4F', color: 'white',
            padding: '12px 24px', borderRadius: '25px',
            textDecoration: 'none', fontWeight: 700, fontSize: '15px'
          }}>Back to the map</Link>
          <button onClick={() => {
            setSubmitted(false)
            setForm({ name: '', suburb: '', municipality: 'Nelson Mandela Bay', province: 'Eastern Cape', notes: '', submitter_name: '', submitter_email: '', submitter_phone: '', latitude: null, longitude: null })
            setStep(1)
            mapInstanceRef.current = null
            markerRef.current = null
          }} style={{
            background: 'none', border: '2px solid #E5E7EB',
            padding: '12px 24px', borderRadius: '25px',
            cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: '#374151'
          }}>Suggest another gym</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 0 3rem' }}>
      <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <Link href="/map" style={{ color: '#2D6A4F', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
          ← Back to map
        </Link>
      </div>

      <div style={{ padding: '16px', background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>Suggest a gym</h1>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
          Know an outdoor gym not on the map? Help us find it.
        </p>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              background: s <= step ? '#2D6A4F' : '#E5E7EB',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>Step {step} of 3</div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Step 1: Gym details */}
        {step === 1 && (
          <>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                Gym name <span style={{ color: '#E76F51' }}>*</span>
              </label>
              <input
                type="text" value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="e.g. Westview Park Outdoor Gym"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontSize: '15px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                Suburb / area <span style={{ color: '#E76F51' }}>*</span>
              </label>
              <input
                type="text" value={form.suburb}
                onChange={e => update('suburb', e.target.value)}
                placeholder="e.g. Westview, Kabega Park"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontSize: '15px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>Municipality</label>
              <input
                type="text" value={form.municipality}
                onChange={e => update('municipality', e.target.value)}
                placeholder="e.g. Nelson Mandela Bay"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontSize: '15px' }}
              />
            </div>

          

            {/* GPS pin requirement notice */}
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', padding: '12px 14px' }}>
              <p style={{ fontSize: '13px', color: '#92400E', margin: 0 }}>
                📍 In the next step you'll drop a pin on the map to show exactly where this gym is. Try to be as accurate as possible.
              </p>
            </div>

            <button
              onClick={() => canProceedStep1 && setStep(2)}
              disabled={!canProceedStep1}
              style={{
                width: '100%', padding: '14px',
                background: canProceedStep1 ? '#2D6A4F' : '#D1D5DB',
                color: 'white', border: 'none', borderRadius: '25px', fontSize: '15px', fontWeight: 700,
                cursor: canProceedStep1 ? 'pointer' : 'not-allowed'
              }}
            >
              Next: Pin the location →
            </button>

            {!canProceedStep1 && (
              <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', marginTop: '-8px' }}>
                Fill in name and suburb to continue
              </p>
            )}
          </>
        )}

        {/* Step 2: Map pin drop */}
        {step === 2 && (
          <>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontWeight: 600, fontSize: '14px' }}>
                  Pin the gym location <span style={{ color: '#E76F51' }}>*</span>
                </label>
                <button
                  onClick={getGPSLocation}
                  disabled={gpsLoading}
                  style={{
                    background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE',
                    padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    cursor: gpsLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {gpsLoading ? '📡 Locating...' : '📡 Use my location'}
                </button>
              </div>

              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                Tap the map to drop a pin. Drag the pin to adjust. Or use your GPS to start near your location.
              </div>

              <div
                ref={mapRef}
                style={{
                  height: '280px', borderRadius: '10px',
                  border: '1.5px solid #D1D5DB', overflow: 'hidden'
                }}
              />

              {form.latitude && form.longitude ? (
                <div style={{ fontSize: '12px', color: '#2D6A4F', marginTop: '6px', fontWeight: 600 }}>
                  ✓ Pin placed at {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px' }}>
                  No pin placed yet — tap the map above
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '14px', background: 'white', border: '2px solid #E5E7EB',
                borderRadius: '25px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', color: '#374151'
              }}>← Back</button>
              <button
                onClick={() => form.latitude && form.longitude && setStep(3)}
                disabled={!form.latitude || !form.longitude}
                style={{
                  flex: 2, padding: '14px',
                  background: (form.latitude && form.longitude) ? '#2D6A4F' : '#D1D5DB',
                  color: 'white', border: 'none', borderRadius: '25px', fontSize: '15px', fontWeight: 700,
                  cursor: (form.latitude && form.longitude) ? 'pointer' : 'not-allowed'
                }}
              >Next →</button>
            </div>
          </>
        )}

        {/* Step 3: Contact info + notes */}
        {step === 3 && (
          <>
            <div style={{ background: '#F0FDF4', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#2D6A4F' }}>
              <strong>{form.name}</strong> · {form.suburb}<br />
              <span style={{ opacity: 0.8 }}>📍 {form.latitude?.toFixed(4)}, {form.longitude?.toFixed(4)}</span>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                Any extra info? (optional)
              </label>
              <textarea
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
                placeholder="e.g. It's at the far end of the park near the tennis courts. Has 5 machines."
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1.5px solid #D1D5DB', fontSize: '14px', resize: 'vertical',
                  fontFamily: 'inherit', lineHeight: 1.5
                }}
              />
            </div>

            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>
              Optional — leave your details if you'd like us to follow up.
            </p>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>Your name (optional)</label>
              <input
                type="text" value={form.submitter_name}
                onChange={e => update('submitter_name', e.target.value)}
                placeholder="e.g. Norman"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontSize: '15px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>Email (optional)</label>
              <input
                type="email" value={form.submitter_email}
                onChange={e => update('submitter_email', e.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontSize: '15px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>Phone number (optional)</label>
              <input
                type="tel" value={form.submitter_phone}
                onChange={e => update('submitter_phone', e.target.value)}
                placeholder="e.g. 082 123 4567"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontSize: '15px' }}
              />
            </div>

            {submitError && (
              <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }}>
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(2)} style={{
                flex: 1, padding: '14px', background: 'white', border: '2px solid #E5E7EB',
                borderRadius: '25px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', color: '#374151'
              }}>← Back</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 2, padding: '14px',
                  background: submitting ? '#9CA3AF' : '#2D6A4F',
                  color: 'white', border: 'none', borderRadius: '25px', fontSize: '15px', fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Submitting...' : 'Submit suggestion 📍'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}