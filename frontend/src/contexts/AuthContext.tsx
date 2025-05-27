// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser as apiLoginUser, User } from '../services/api';

interface LoginResponse {
    user: User;
    token: string;
}

interface LoginCredentials {
    email: string;
    password: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    error: string | null;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Ефект для завантаження стану аутентифікації з localStorage
    useEffect(() => {
        const loadAuthState = () => {
            try {
                const storedToken = localStorage.getItem('authToken');
                const storedUserJson = localStorage.getItem('authUser');

                console.log('Loading auth state:', {
                    hasToken: !!storedToken,
                    hasUser: !!storedUserJson
                });

                if (storedToken && storedUserJson) {
                    try {
                        const parsedUser = JSON.parse(storedUserJson) as User;
                        console.log('Parsed user:', parsedUser);

                        // Перевіряємо, чи є всі необхідні поля
                        if (parsedUser.id && parsedUser.name && parsedUser.email) {
                            setUser(parsedUser);
                            setToken(storedToken);
                            setIsAuthenticated(true);
                            console.log('Auth restored successfully');
                        } else {
                            console.warn('Invalid user data in localStorage');
                            // Очищуємо некоректні дані
                            localStorage.removeItem('authToken');
                            localStorage.removeItem('authUser');
                        }
                    } catch (parseError) {
                        console.error('Failed to parse user data:', parseError);
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('authUser');
                    }
                } else {
                    console.log('No stored auth data found');
                }
            } catch (e) {
                console.error('Failed to load auth state from localStorage:', e);
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
            } finally {
                setIsLoading(false);
            }
        };

        // Додаємо невелику затримку для плавності
        const timer = setTimeout(loadAuthState, 100);
        return () => clearTimeout(timer);
    }, []);

    const login = async (credentials: LoginCredentials) => {
        setError(null);
        try {
            console.log('Attempting login...');
            const loginResponse: LoginResponse = await apiLoginUser(credentials);
            const { user: loggedInUser, token: authToken } = loginResponse;

            console.log('Login successful:', { user: loggedInUser, hasToken: !!authToken });

            // Зберігаємо дані
            localStorage.setItem('authUser', JSON.stringify(loggedInUser));
            localStorage.setItem('authToken', authToken);

            // Оновлюємо стан
            setUser(loggedInUser);
            setToken(authToken);
            setIsAuthenticated(true);

            console.log('Auth state updated');
        } catch (err: any) {
            console.error('Login failed:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Помилка логіну. Спробуйте ще раз.';
            setError(errorMessage);
            throw err;
        }
    };

    const logout = () => {
        console.log('Logging out...');

        // Очищуємо localStorage
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');

        // Очищуємо стан
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setError(null);

        console.log('Logout completed');
    };

    const clearError = () => {
        setError(null);
    };

    // Логування для дебагу
    useEffect(() => {
        console.log('Auth state changed:', {
            isAuthenticated,
            hasUser: !!user,
            userName: user?.name,
            hasToken: !!token,
            isLoading
        });
    }, [isAuthenticated, user, token, isLoading]);

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

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};