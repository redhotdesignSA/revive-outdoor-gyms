import Link from 'next/link'

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)',
        color: 'white',
        padding: '3rem 1.5rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.2 }}>
          Our outdoor gyms are broken.<br />Let's fix them.
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
          Map, report, and track the condition of free outdoor gym equipment across South Africa.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/map" style={{
            background: 'white',
            color: '#2D6A4F',
            padding: '12px 28px',
            borderRadius: '25px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '15px'
          }}>View the Map</Link>
          <Link href="/report" style={{
            background: '#E76F51',
            color: 'white',
            padding: '12px 28px',
            borderRadius: '25px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '15px'
          }}>Report a Problem</Link>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex',
        background: 'white',
        borderBottom: '1px solid #E5E7EB'
      }}>
        {[
          { num: '0', label: 'Gyms mapped' },
          { num: '0', label: 'Reports submitted' },
          { num: '0', label: 'Issues fixed' },
        ].map((stat, i) => (
          <div key={i} style={{
            flex: 1,
            padding: '20px 8px',
            textAlign: 'center',
            borderRight: i < 2 ? '1px solid #E5E7EB' : 'none'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#2D6A4F' }}>{stat.num}</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ padding: '2rem 1.5rem' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>How it works</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
          {[
            { icon: '📍', title: 'Find your gym', desc: 'Search the map for outdoor gyms near you' },
            { icon: '📸', title: 'Report damage', desc: 'Photo and describe broken or unsafe equipment' },
            { icon: '📊', title: 'Track progress', desc: 'See when councils respond and issues get fixed' },
          ].map((step, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
              <span style={{ fontSize: '28px', flexShrink: 0 }}>{step.icon}</span>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{step.title}</div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '1rem 1.5rem 3rem', textAlign: 'center' }}>
        <Link href="/gyms" style={{
          display: 'inline-block',
          background: '#2D6A4F',
          color: 'white',
          padding: '14px 32px',
          borderRadius: '25px',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '15px'
        }}>Browse all gyms →</Link>
      </div>
    </div>
  )
}