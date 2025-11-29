export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      backgroundColor: '#1a1a1a',
      borderTop: '1px solid #333',
      padding: '2rem 0',
      marginTop: '4rem',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ color: '#888', fontSize: '0.875rem' }}>
          © {currentYear} Collective Social
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a
            href="https://github.com/collectivesocial/collective-social-web"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#ddd',
              textDecoration: 'none',
              fontSize: '0.875rem',
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#646cff'}
            onMouseOut={(e) => e.currentTarget.style.color = '#ddd'}
          >
            GitHub
          </a>
          <a
            href="/feedback"
            style={{
              color: '#ddd',
              textDecoration: 'none',
              fontSize: '0.875rem',
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#646cff'}
            onMouseOut={(e) => e.currentTarget.style.color = '#ddd'}
          >
            Provide Feedback
          </a>
        </div>
      </div>
    </footer>
  );
}
