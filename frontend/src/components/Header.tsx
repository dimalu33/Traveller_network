// src/components/Header.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        if (window.confirm('Ви впевнені, що хочете вийти?')) {
            logout();
        }
    };

    return (
        <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #dee2e6',
            marginBottom: '2rem'
        }}>
            <h1 style={{ margin: 0, color: '#333' }}>
                Соціальна мережа
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#666' }}>
                    Привіт, {user?.name || user?.email || 'Користувач'}!
                </span>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#c82333';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc3545';
                    }}
                >
                    Вийти
                </button>
            </div>
        </header>
    );
};

export default Header;