// src/components/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginForm: React.FC = () => {
    const { login, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login({ email, password });
        } catch (err) {
            setError('Неправильний логін або пароль');
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ margin: '20px auto', padding: '20px', border: '1px solid #ddd', maxWidth: '400px', borderRadius: '8px' }}>
            <h2>Вхід</h2>
            <div style={{ marginBottom: '10px' }}>
                <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Пароль:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
            </div>
            {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
            <button
                type="submit"
                disabled={isLoading}
                style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                {isLoading ? 'Вхід...' : 'Увійти'}
            </button>
        </form>
    );
};

export default LoginForm;