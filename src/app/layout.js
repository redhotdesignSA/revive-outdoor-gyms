import './globals.css'

export const metadata = {
  title: 'Revive Our Outdoor Gyms',
  description: 'Track and report the condition of outdoor gym equipment across South Africa',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header style={{
          background: '#2D6A4F',
          color: 'white',
          padding: '0 1rem',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <a href="/" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🏋️</span>
            <span style={{ fontWeight: 700, fontSize: '16px' }}>Revive Our Gyms</span>
          </a>
          <a href="/report" style={{
            background: '#E76F51',
            color: 'white',
            padding: '6px 14px',
            borderRadius: '20px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 600
          }}>Report Issue</a>
        </header>
        <main style={{ minHeight: 'calc(100vh - 56px)' }}>
          {children}
        </main>
      </body>
    </html>
  )
}