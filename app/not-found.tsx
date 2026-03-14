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
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
          </p>

          {/* Action buttons — pure CSS hover via className */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/"
              className="not-found-btn-primary"
            >
              🏠 Go Home
            </Link>
            <Link
              href="/locations"
              className="not-found-btn-outline"
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
                  className="not-found-quick-link"
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
        .not-found-btn-primary {
          display: inline-block;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: #ffffff;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 15px;
          transition: opacity 0.2s, transform 0.2s;
        }
        .not-found-btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }
        .not-found-btn-outline {
          display: inline-block;
          background: transparent;
          color: #a78bfa;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 15px;
          border: 1px solid rgba(139,92,246,0.4);
          transition: border-color 0.2s, color 0.2s, transform 0.2s;
        }
        .not-found-btn-outline:hover {
          border-color: rgba(139,92,246,0.8);
          color: #c4b5fd;
          transform: translateY(-2px);
        }
        .not-found-quick-link {
          color: #8b5cf6;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .not-found-quick-link:hover {
          color: #a78bfa;
        }
      `}</style>
    </main>
  );
}
