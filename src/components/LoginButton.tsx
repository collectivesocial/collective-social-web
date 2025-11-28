import { useState } from 'react';

interface LoginButtonProps {
  apiUrl?: string;
}

export function LoginButton({ apiUrl = 'http://127.0.0.1:3000' }: LoginButtonProps) {
  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Create a form to submit to the API
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${apiUrl}/login`;
      
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'input';
      input.value = handle;
      
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2>Login with Bluesky</h2>
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="Enter your handle or DID"
          disabled={isLoading}
          style={{
            padding: '0.5rem',
            fontSize: '1rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
          required
        />
        <button
          type="submit"
          disabled={isLoading || !handle}
          style={{
            padding: '0.75rem',
            fontSize: '1rem',
            backgroundColor: '#1185fe',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'wait' : 'pointer',
            opacity: isLoading || !handle ? 0.6 : 1,
          }}
        >
          {isLoading ? 'Redirecting...' : 'Login with Bluesky'}
        </button>
        {error && (
          <p style={{ color: 'red', margin: 0 }}>{error}</p>
        )}
      </form>
    </div>
  );
}
