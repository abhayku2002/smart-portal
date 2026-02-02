import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
    const [email, setEmail] = useState('');
    const router = useRouter();

    const handleLogin = (e) => {
        e.preventDefault();
        if (email) {
            localStorage.setItem('user', email);
            router.push('/');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
            <form onSubmit={handleLogin} style={{ padding: 40, border: '1px solid #ccc', borderRadius: 8 }}>
                <h2>Login</h2>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ padding: 10, width: '100%', marginBottom: 10 }}
                    required
                />
                <button type="submit" style={{ padding: 10, width: '100%', cursor: 'pointer', background: '#0070f3', color: 'white', border: 'none', borderRadius: 4 }}>
                    Login
                </button>
            </form>
        </div>
    );
}
