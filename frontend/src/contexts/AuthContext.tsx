// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Припускаємо, що ваш api.ts експортує функцію loginUser та тип User
import { loginUser as apiLoginUser, User } from '../services/api';

// Інтерфейс для даних, які повертає наша функція loginUser з api.ts
interface LoginResponse {
    user: User;
    token: string;
}

// Тип для даних, які передаються у функцію login
interface LoginCredentials {
    email: string;
    password: string;
}

// Тип для значень, які надає наш контекст
interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean; // Для початкового завантаження стану з localStorage
    login: (credentials: LoginCredentials) => Promise<void>; // login тепер асинхронний
    logout: () => void;
    error: string | null; // Для відображення помилок логіну
    clearError: () => void; // Щоб очистити помилку
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Починаємо із завантаженням
    const [error, setError] = useState<string | null>(null);

    // Ефект для завантаження стану аутентифікації з localStorage при першому завантаженні
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem('authToken');
            const storedUserJson = localStorage.getItem('authUser');

            if (storedToken && storedUserJson) {
                const parsedUser = JSON.parse(storedUserJson) as User;
                setUser(parsedUser);
                setToken(storedToken);
                setIsAuthenticated(true);
            }
        } catch (e) {
            console.error("Failed to load auth state from localStorage", e);
            // Якщо дані пошкоджені, очистимо їх
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
        } finally {
            setIsLoading(false); // Завершуємо завантаження в будь-якому випадку
        }
    }, []); // Пустий масив залежностей, щоб виконати один раз

    const login = async (credentials: LoginCredentials) => {
        setError(null); // Очистити попередні помилки
        try {
            const loginResponse: LoginResponse = await apiLoginUser(credentials); // Викликаємо API
            const { user: loggedInUser, token: authToken } = loginResponse;

            localStorage.setItem('authUser', JSON.stringify(loggedInUser));
            localStorage.setItem('authToken', authToken);

            setUser(loggedInUser);
            setToken(authToken);
            setIsAuthenticated(true);
        } catch (err: any) { // Краще типізувати помилку, якщо знаєте її структуру
            console.error("Login failed:", err);
            const errorMessage = err.response?.data?.message || err.message || 'Помилка логіну. Спробуйте ще раз.';
            setError(errorMessage);
            // Важливо: викидаємо помилку далі, щоб компонент міг її обробити, якщо потрібно
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setError(null);
        // Додатково: можна перенаправити на сторінку логіну
        // наприклад, window.location.href = '/login';
        // або за допомогою React Router: navigate('/login');
    };

    const clearError = () => {
        setError(null);
    };

    // Не рендеримо дочірні елементи, поки не завершилося початкове завантаження з localStorage
    // Це запобігає "миготінню" або відображенню невірного стану UI.
    // if (isLoading) {
    // return <p>Завантаження стану автентифікації...</p>; // Або ваш компонент-завантажувач
    // }
    // Краще обробляти isLoading в самому App.tsx, щоб уникнути ререндеру всього дерева
    // тут ми просто надаємо значення isLoading

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated,
                isLoading,
                login,
                logout,
                error,
                clearError
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Хук для зручного доступу до контексту
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};