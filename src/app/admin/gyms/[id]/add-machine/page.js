'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import imageCompression from 'browser-image-compression'

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

export default function AddMachinePage() {
  const params = useParams()
  const router = useRouter()
  const [gym, setGym] = useState(null)
  const [saving, setSaving] = useState(false)
  const [photos, setPhotos] = useState([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  const [machine, setMachine] = useState({
    machine_label: '',
    machine_type: '',
    condition_status: 'unknown',
    usability_status: 'usable',
    safety_flag: false,
  })

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }

      const { data } = await supabase.from('gym_sites').select('name').eq('id', params.id).single()
      setGym(data)
    }
    init()
  }, [params.id, router])

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files).slice(0, 5)
    setUploadingPhotos(true)
    const compressed = await Promise.all(files.map(file =>
      imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1200 })
    ))
    setPhotos(compressed.map(file => ({ file, preview: URL.createObjectURL(file), name: file.name })))
    setUploadingPhotos(false)
  }

  const handleSave = async () => {
    if (!machine.machine_label.trim()) { alert('Please enter a machine name'); return }
    setSaving(true)
    const supabase = createClient()

    const { data: machineData, error } = await supabase
      .from('equipment_units')
      .insert([{ gym_site_id: params.id, ...machine }])
      .select()
      .single()

    if (error) { alert('Error saving machine: ' + error.message); setSaving(false); return }

    for (const photo of photos) {
      const fileName = `${params.id}/${machineData.id}/${Date.now()}-${photo.name}`
      const { data: uploadData } = await supabase.storage.from('gym-photos').upload(fileName, photo.file)
      if (uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('gym-photos').getPublicUrl(fileName)
        await supabase.from('photos').insert([{
          gym_site_id: params.id,
          equipment_unit_id: machineData.id,
          image_url: publicUrl,
          photo_type: 'machine',
        }])
      }
    }

    router.push(`/admin/gyms/${params.id}`)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 0 3rem' }}>
      <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <Link href={`/admin/gyms/${params.id}`} style={{ color: '#2D6A4F', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
          ← {gym?.name || 'Back'}
        </Link>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Add machine</h1>

        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>Machine name *</label>
          <input
            type="text"
            value={machine.machine_label}
            onChange={e => setMachine(prev => ({ ...prev, machine_label: e.target.value }))}
            placeholder="e.g. Double Stepper, Air Walker, Chest Press"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontSize: '15px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>Condition</label>
            <select
              value={machine.condition_status}
              onChange={e => setMachine(prev => ({ ...prev, condition_status: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontSize: '14px', background: 'white' }}
            >
              {CONDITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>Usability</label>
            <select
              value={machine.usability_status}
              onChange={e => setMachine(prev => ({ ...prev, usability_status: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #D1D5DB', fontSize: '14px', background: 'white' }}
            >
              {USABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', background: '#FFF7ED', borderRadius: '10px' }}>
          <input
            type="checkbox"
            checked={machine.safety_flag}
            onChange={e => setMachine(prev => ({ ...prev, safety_flag: e.target.checked }))}
            style={{ accentColor: '#E76F51', width: '18px', height: '18px' }}
          />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#92400E' }}>⚠️ Flag as safety hazard</span>
        </label>

        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>
            Photos of this machine (max 5)
          </label>
          <label style={{
            display: 'block', padding: '20px', textAlign: 'center',
            border: '2px dashed #D1D5DB', borderRadius: '12px',
            cursor: 'pointer', color: '#6B7280', fontSize: '14px'
          }}>
            📷 Add photos
            <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} style={{ display: 'none' }} />
          </label>
          {uploadingPhotos && <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '13px', marginTop: '8px' }}>Compressing...</div>}
          {photos.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              {photos.map((p, i) => (
                <img key={i} src={p.preview} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '14px',
            background: saving ? '#D1D5DB' : '#2D6A4F',
            color: 'white', border: 'none', borderRadius: '25px',
            fontSize: '15px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : '✓ Save machine'}
        </button>
      </div>
    </div>
  )
}