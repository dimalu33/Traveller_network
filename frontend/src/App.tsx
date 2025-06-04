// src/App.tsx
import React from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import PostList from './components/PostList';
import Header from './components/Header';
import './App.css';

const App: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    // Показуємо завантаження поки перевіряємо стан автентифікації  fasasdf
    if (isLoading) {
        return (
            <div className="loading-container">
                <p>Завантаження...</p>
            </div>
        );
    }

    return (
        <div className="App">
            {isAuthenticated ? (
                <>
                    <Header />
                    <main>
                        <PostList />
                    </main>
                </>
            ) : (
                <LoginForm />
            )}
        </div>
    );
};

export default App;