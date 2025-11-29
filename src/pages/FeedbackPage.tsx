import { useState } from 'react';

export function FeedbackPage() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = 'http://127.0.0.1:3000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/feedback`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
      setMessage('');
      setEmail('');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
    }}>
      <h1 style={{ marginBottom: '1rem' }}>Provide Feedback</h1>
      
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
      }}>
        <p style={{ color: '#ddd', marginBottom: '1.5rem' }}>
          We'd love to hear your thoughts, suggestions, and feedback about Collective Social!
        </p>

        {submitted && (
          <div style={{
            backgroundColor: '#2ecc71',
            color: 'white',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
          }}>
            Thank you for your feedback! We'll review it shortly.
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
              Your Feedback *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2a2a2a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                fontSize: '1rem',
                resize: 'vertical',
              }}
              placeholder="Tell us what you think..."
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
              Email (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2a2a2a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                fontSize: '1rem',
              }}
              placeholder="your@email.com"
            />
            <p style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>
              Optional: Provide your email if you'd like us to follow up
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: submitting ? '#555' : '#646cff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: '500',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>

      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '2rem',
      }}>
        <p style={{ color: '#ddd', marginBottom: '1.5rem' }}>
          Other ways to reach us:
        </p>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Ways to Provide Feedback:</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#646cff', marginBottom: '0.5rem' }}>
              GitHub Issues
            </h3>
            <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Report bugs or request features on our GitHub repository:
            </p>
            <a
              href="https://github.com/collectivesocial/collective-social-web/issues"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#646cff',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              Open an Issue →
            </a>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#646cff', marginBottom: '0.5rem' }}>
              Bluesky
            </h3>
            <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Share your thoughts on Bluesky and tag us:
            </p>
            <a
              href="https://bsky.app/profile/collectivesocial.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#646cff',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              @collectivesocial.app
            </a>
          </div>
        </div>

        <div style={{
          backgroundColor: '#2a2a2a',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '1rem',
          marginTop: '1.5rem',
        }}>
          <p style={{ color: '#ddd', fontSize: '0.875rem', margin: 0 }}>
            💡 <strong>Tip:</strong> When reporting issues, please include as much detail as possible
            about what you were doing when the issue occurred.
          </p>
        </div>
      </div>
    </div>
  );
}
