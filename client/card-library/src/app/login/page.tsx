'use client';
import { useState, useEffect } from 'react';
import axiosInstance from '../utils/fetchWithAgent';
import Cookies from 'js-cookie';

async function login(username: string, password: string) {
    try {
        const response = await axiosInstance.post(
            '/login',
            { name: username, password },
            { withCredentials: true }
        );
        const jwtToken = response.data.token; // Oczekujemy tokena w odpowiedzi
        if (jwtToken) {
            localStorage.setItem('jwt', jwtToken); // Zapisujemy token w localStorage
        }
        return true;
    } catch (error: any) {
        if (error.response && error.response.status === 401) {
            throw new Error('Niepoprawny login lub hasło');
        }
        console.error('Login failed:', error);
        throw new Error('Invalid password or username');
    }
}

async function logout() {
    try {
        await axiosInstance.post('/logout', {}, { withCredentials: true });

        Cookies.remove('token');
        Cookies.remove('session');
        localStorage.removeItem('jwt'); // Usuwamy token z localStorage

        console.log('Logged out and cookies cleared.');
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

export default function LoginPage() {
    const [name, setName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    useEffect(() => {
        axiosInstance
            .get('/check-auth', { withCredentials: true })
            .then(() => {
                const jwtToken = localStorage.getItem('jwt');
                if (jwtToken) {
                    setIsLoggedIn(true);
                }
            })
            .catch(() => setIsLoggedIn(false));
    }, []);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await login(name, password);
            setError('');
            setIsLoggedIn(true);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleLogout = async () => {
        await logout();
        setIsLoggedIn(false);
    };

    return (
        <div>
            <h1>{isLoggedIn ? 'Hello!' : 'Login in site'}</h1>
            {isLoggedIn ? (
                <button onClick={handleLogout}>Logout</button>
            ) : (
                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="username"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button id="login-button" type="submit">
                        Login
                    </button>
                </form>
            )}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}