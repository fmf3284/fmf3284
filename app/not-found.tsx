import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="content-wrapper">
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)',
          padding: '40px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: '10%', left: '5%',
          width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '5%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div style={{ textAlign: 'center', maxWidth: '560px', position: 'relative', zIndex: 1 }}>
          {/* 404 Number */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <p style={{
              fontSize: 'clamp(100px, 20vw, 160px)',
              fontWeight: 900,
              margin: 0,
              lineHeight: 1,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-4px',
              opacity: 0.9,
            }}>
              404
            </p>
            {/* Emoji floating above */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '48px',
              animation: 'float 3s ease-in-out infinite',
            }}>
              🏋️
            </div>
          </div>

          {/* Message */}
          <h1 style={{
            color: '#ffffff',
            fontSize: 'clamp(22px, 4vw, 30px)',
            fontWeight: 700,
            margin: '0 0 12px',
          }}>
            Looks like this page skipped leg day
          </h1>
          <p style={{
            color: '#a0a0b0',
            fontSize: '16px',
            lineHeight: 1.6,
            margin: '0 0 36px',
          }}>
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '14px 32px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '15px',
                transition: 'opacity 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '0.9'; (e.target as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '1'; (e.target as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              🏠 Go Home
            </Link>
            <Link
              href="/locations"
              style={{
                display: 'inline-block',
                background: 'transparent',
                color: '#a78bfa',
                textDecoration: 'none',
                padding: '14px 32px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '15px',
                border: '1px solid rgba(139,92,246,0.4)',
                transition: 'border-color 0.2s, color 0.2s',
              }}
            >
              🔍 Find Locations
            </Link>
          </div>

          {/* Quick links */}
          <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid rgba(139,92,246,0.15)' }}>
            <p style={{ color: '#606070', fontSize: '13px', marginBottom: '12px' }}>Popular pages</p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { href: '/locations', label: 'Locations' },
                { href: '/deals', label: 'Deals' },
                { href: '/blog', label: 'Blog' },
                { href: '/contact', label: 'Contact' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    color: '#8b5cf6',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'color 0.2s',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-12px); }
        }
      `}</style>
    </main>
  );
}
