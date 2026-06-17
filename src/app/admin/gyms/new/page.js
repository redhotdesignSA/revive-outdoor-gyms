'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import imageCompression from 'browser-image-compression'

const STATUS_OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'needs_maintenance', label: 'Needs maintenance' },
  { value: 'critical', label: 'Critical' },
  { value: 'unknown', label: 'Unknown' },
]

const CONDITION_OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'worn', label: 'Worn' },
  { value: 'unsafe', label: 'Unsafe' },
  { value: 'broken', label: 'Broken' },
  { value: 'unknown', label: 'Unknown' },
]

const USABILITY_OPTIONS = [
  { value: 'usable', label: 'Usable' },
  { value: 'partly_usable', label: 'Partly usable' },
  { value: 'unusable', label: 'Unusable' },
]

function AddGymForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)

  const [gym, setGym] = useState({
    name: searchParams.get('name') || '',
    suburb: searchParams.get('suburb') || '',
    municipality: searchParams.get('municipality') || '',
    province: '',
    overall_status: 'unknown',
    public_notes: searchParams.get('notes') || '',
    latitude: searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null,
    longitude: searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : null,
  })

  const [machines, setMachines] = useState([
    { machine_label: '', condition_status: 'unknown', usability_status: 'usable', safety_flag: false }
  ])

  const [photos, setPhotos] = useState([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/admin/login')
    }
    checkAuth()
  }, [router])

  // Init map on step 2
  useEffect(() => {
    if (step !== 2) return
    if (mapInstanceRef.current) return

    setTimeout(() => {
      import('leaflet').then((L) => {
        if (!mapRef.current || mapInstanceRef.current) return

        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        // Use pre-filled lat/lng from suggestion if available, otherwise default to PE
        const center = gym.latitude ? [gym.latitude, gym.longitude] : [-33.9600, 25.6000]
        const zoom = gym.latitude ? 16 : 13
        const map = L.map(mapRef.current).setView(center, zoom)
        mapInstanceRef.current = map

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map)

        // Place marker if we already have coordinates from the suggestion
        if (gym.latitude) {
          markerRef.current = L.marker([gym.latitude, gym.longitude], { draggable: true }).addTo(map)
          markerRef.current.bindPopup('Drag to adjust').openPopup()
          markerRef.current.on('dragend', (e) => {
            const pos = e.target.getLatLng()
            setGym(prev => ({ ...prev, latitude: pos.lat, longitude: pos.lng }))
          })
        }

        map.on('click', (e) => {
          const { lat, lng } = e.latlng
          setGym(prev => ({ ...prev, latitude: lat, longitude: lng }))

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
          } else {
            markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map)
            markerRef.current.on('dragend', (ev) => {
              const pos = ev.target.getLatLng()
              setGym(prev => ({ ...prev, latitude: pos.lat, longitude: pos.lng }))
            })
          }
        })
      })
    }, 100)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [step])

  const handleGPS = () => {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setGym(prev => ({ ...prev, latitude: lat, longitude: lng }))

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16)
          import('leaflet').then((L) => {
            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng])
            } else {
              markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current)
              markerRef.current.on('dragend', (e) => {
                const p = e.target.getLatLng()
                setGym(prev => ({ ...prev, latitude: p.lat, longitude: p.lng }))
              })
            }
          })
        }
        setGpsLoading(false)
      },
      () => {
        alert('Could not get your location. Please tap the map to place a pin manually.')
        setGpsLoading(false)
      }
    )
  }

  const addMachine = () => {
    setMachines(prev => [...prev, {
      machine_label: '', condition_status: 'unknown', usability_status: 'usable', safety_flag: false
    }])
  }

  const removeMachine = (index) => {
    setMachines(prev => prev.filter((_, i) => i !== index))
  }

  const updateMachine = (index, field, value) => {
    setMachines(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files)
    setUploadingPhotos(true)

    const compressed = await Promise.all(files.map(file =>
      imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1200 })
    ))

    const previews = compressed.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }))

    setPhotos(prev => [...prev, ...previews])
    setUploadingPhotos(false)
  }

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    // Insert gym — only columns that exist in gym_sites schema
    const { data: gymData, error: gymError } = await supabase
      .from('gym_sites')
      .insert([{
        name: gym.name,
        suburb: gym.suburb,
        municipality: gym.municipality,
        overall_status: gym.overall_status,
        public_notes: gym.public_notes || null,
        latitude: gym.latitude,
        longitude: gym.longitude,
      }])
      .select()
      .single()

    if (gymError) {
      alert('Error saving gym: ' + gymError.message)
      setSaving(false)
      return
    }

    // Insert machines
    const validMachines = machines.filter(m => m.machine_label.trim())
    if (validMachines.length > 0) {
      await supabase.from('equipment_units').insert(
        validMachines.map(m => ({
          gym_site_id: gymData.id,
          machine_label: m.machine_label,
          condition_status: m.condition_status,
          usability_status: m.usability_status,
          safety_flag: m.safety_flag,
        }))
      )
    }

    // Upload photos
    for (const photo of photos) {
      const fileName = `${gymData.id}/${Date.now()}-${photo.name}`
      const { data: uploadData } = await supabase.storage
        .from('gym-photos')
        .upload(fileName, photo.file)

      if (uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('gym-photos')
          .getPublicUrl(fileName)

        await supabase.from('photos').insert([{
          gym_site_id: gymData.id,
          image_url: publicUrl,
          photo_type: 'gym',
        }])
      }
    }

    router.push(`/admin/gyms/${gymData.id}`)
  }

  const canProceedStep1 = gym.name && gym.suburb && gym.municipality

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 0 3rem' }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Header */}
      <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/admin" style={{ color: '#2D6A4F', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
          ← Admin
        </Link>
        <span style={{ color: '#D1D5DB' }}>|</span>
        <span style={{ fontWeight: 700, fontSize: '16px' }}>Add new gym</span>
      </div>

      {/* Progress */}
      <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['Details', 'Location', 'Equipment', 'Photos'].map((label, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: '4px', borderRadius: '2px', marginBottom: '4px',
                background: i + 1 <= step ? '#2D6A4F' : '#E5E7EB'
              }} />
              <div style={{ fontSize: '10px', color: i + 1 === step ? '#2D6A4F' : '#9CA3AF', fontWeight: i + 1 === step ? 700 : 400 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Step 1 - Details */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Gym details</h2>

            {[
              { label: 'Gym name *', field: 'name', placeholder: 'e.g. Summerstrand Beachfront Gym' },
              { label: 'Suburb *', field: 'suburb', placeholder: 'e.g. Summerstrand' },
              { label: 'Municipality / City *', field: 'municipality', placeholder: 'e.g. Nelson Mandela Bay' },
              { label: 'Province', field: 'province', placeholder: 'e.g. Eastern Cape' },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>{label}</label>
                <input
                  type="text"
                  value={gym[field]}
                  onChange={e => setGym(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1.5px solid #D1D5DB', fontSize: '15px'
                  }}
                />
              </div>
            ))}

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>Overall status</label>
              <select
                value={gym.overall_status}
                onChange={e => setGym(prev => ({ ...prev, overall_status: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontSize: '15px', background: 'white' }}
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>Public notes</label>
              <textarea
                value={gym.public_notes}
                onChange={e => setGym(prev => ({ ...prev, public_notes: e.target.value }))}
                placeholder="Describe the gym — location, usage, condition..."
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1.5px solid #D1D5DB', fontSize: '14px',
                  resize: 'vertical', fontFamily: 'inherit'
                }}
              />
            </div>

            <button
              onClick={() => canProceedStep1 && setStep(2)}
              disabled={!canProceedStep1}
              style={{
                width: '100%', padding: '14px',
                background: canProceedStep1 ? '#2D6A4F' : '#D1D5DB',
                color: 'white', border: 'none', borderRadius: '25px',
                fontSize: '15px', fontWeight: 700,
                cursor: canProceedStep1 ? 'pointer' : 'not-allowed'
              }}
            >
              Next: Set location →
            </button>
          </>
        )}

        {/* Step 2 - Location */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Set gym location</h2>

            {gym.latitude && (
              <div style={{ background: '#F0FDF4', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#2D6A4F' }}>
                ✓ Location pre-filled from suggestion — drag the pin to adjust if needed
              </div>
            )}

            <button
              onClick={handleGPS}
              disabled={gpsLoading}
              style={{
                width: '100%', padding: '12px',
                background: gpsLoading ? '#D1D5DB' : '#2D6A4F',
                color: 'white', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              📍 {gpsLoading ? 'Getting location...' : 'Use my current location'}
            </button>

            <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
              — or tap the map to place a pin —
            </div>

            <div ref={mapRef} style={{ height: '320px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #E5E7EB' }} />

            {gym.latitude && (
              <div style={{ background: '#F9FAFB', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#6B7280' }}>
                📍 {gym.latitude.toFixed(5)}, {gym.longitude.toFixed(5)}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '14px', background: 'white',
                border: '2px solid #E5E7EB', borderRadius: '25px',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer', color: '#374151'
              }}>← Back</button>
              <button
                onClick={() => gym.latitude && setStep(3)}
                disabled={!gym.latitude}
                style={{
                  flex: 2, padding: '14px',
                  background: gym.latitude ? '#2D6A4F' : '#D1D5DB',
                  color: 'white', border: 'none', borderRadius: '25px',
                  fontSize: '15px', fontWeight: 700,
                  cursor: gym.latitude ? 'pointer' : 'not-allowed'
                }}
              >Next: Add equipment →</button>
            </div>
          </>
        )}

        {/* Step 3 - Equipment */}
        {step === 3 && (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Equipment</h2>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>Add each machine at this gym.</p>

            {machines.map((machine, index) => (
              <div key={index} style={{
                background: 'white', borderRadius: '12px', padding: '16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>Machine {index + 1}</span>
                  {machines.length > 1 && (
                    <button onClick={() => removeMachine(index)} style={{
                      background: '#FEE2E2', color: '#991B1B', border: 'none',
                      borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer'
                    }}>Remove</button>
                  )}
                </div>

                <input
                  type="text"
                  value={machine.machine_label}
                  onChange={e => updateMachine(index, 'machine_label', e.target.value)}
                  placeholder="Machine name (e.g. Double Stepper, Air Walker)"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1.5px solid #D1D5DB', fontSize: '14px'
                  }}
                />

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#6B7280' }}>Condition</label>
                    <select
                      value={machine.condition_status}
                      onChange={e => updateMachine(index, 'condition_status', e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontSize: '13px', background: 'white' }}
                    >
                      {CONDITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#6B7280' }}>Usability</label>
                    <select
                      value={machine.usability_status}
                      onChange={e => updateMachine(index, 'usability_status', e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontSize: '13px', background: 'white' }}
                    >
                      {USABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={machine.safety_flag}
                    onChange={e => updateMachine(index, 'safety_flag', e.target.checked)}
                    style={{ accentColor: '#E76F51', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#374151' }}>⚠️ Flag as safety hazard</span>
                </label>
              </div>
            ))}

            <button onClick={addMachine} style={{
              width: '100%', padding: '12px',
              background: 'white', border: '2px dashed #D1D5DB',
              borderRadius: '12px', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', color: '#6B7280'
            }}>+ Add another machine</button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(2)} style={{
                flex: 1, padding: '14px', background: 'white',
                border: '2px solid #E5E7EB', borderRadius: '25px',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer', color: '#374151'
              }}>← Back</button>
              <button onClick={() => setStep(4)} style={{
                flex: 2, padding: '14px', background: '#2D6A4F',
                color: 'white', border: 'none', borderRadius: '25px',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer'
              }}>Next: Add photos →</button>
            </div>
          </>
        )}

        {/* Step 4 - Photos */}
        {step === 4 && (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Photos</h2>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>Add photos of the gym and equipment. Photos are compressed automatically.</p>

            <label style={{
              display: 'block', padding: '20px', textAlign: 'center',
              border: '2px dashed #D1D5DB', borderRadius: '12px',
              cursor: 'pointer', color: '#6B7280', fontSize: '14px'
            }}>
              📷 Tap to select photos
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
            </label>

            {uploadingPhotos && (
              <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>Compressing photos...</div>
            )}

            {photos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {photos.map((photo, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img
                      src={photo.preview}
                      alt=""
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      style={{
                        position: 'absolute', top: '4px', right: '4px',
                        background: 'rgba(0,0,0,0.6)', color: 'white',
                        border: 'none', borderRadius: '50%', width: '22px', height: '22px',
                        cursor: 'pointer', fontSize: '12px', fontWeight: 700
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(3)} style={{
                flex: 1, padding: '14px', background: 'white',
                border: '2px solid #E5E7EB', borderRadius: '25px',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer', color: '#374151'
              }}>← Back</button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 2, padding: '14px',
                  background: saving ? '#D1D5DB' : '#E76F51',
                  color: 'white', border: 'none', borderRadius: '25px',
                  fontSize: '15px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Saving...' : '✓ Save gym'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AddGymPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <AddGymForm />
    </Suspense>
  )
}