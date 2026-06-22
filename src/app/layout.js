import './globals.css'

export const metadata = {
  title: 'Gymwatch',
  description: 'Map, report and track the condition of free outdoor gym equipment across South Africa',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/logo-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Poppins', sans-serif" }}>
        <header style={{
          background: '#1F5A3E',
          color: 'white',
          padding: '0 1rem',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <a href="/" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/logo-icon.png"
              alt="Gymwatch logo"
              style={{ height: '38px', width: '38px', borderRadius: '8px', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.3px' }}>Gymwatch</span>
              <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '1.5px', opacity: 0.8, textTransform: 'uppercase' }}>
                Map. <span style={{ color: '#E26745' }}>Report.</span> Track.
              </span>
            </div>
          </a>
          <a href="/report" style={{
            background: '#E26745',
            color: 'white',
            padding: '6px 14px',
            borderRadius: '20px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 600
          }}>Report something</a>
        </header>
        <main style={{ minHeight: 'calc(100vh - 60px)' }}>
          {children}
        </main>
      </body>
    </html>
  )
}