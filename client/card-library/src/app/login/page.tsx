'use client'
import { useState, useEffect } from 'react';
import axiosInstance from '../utils/fetchWithAgent';

async function login(username: string, password: string) {
    try {
        const response = await axiosInstance.post('/login', { name: username, password });
        // Zapisujemy token do localStorage
        if (response.data.token) {
            localStorage.setItem('jwt', response.data.token);
            console.log(response.data.token)
            return true;
        }
        return false;
    } catch (error) {
        console.error('Login failed:', error);
        return false;
    }
}

async function logout() {
    // Usuwamy token z localStorage
    localStorage.removeItem('jwt');
}
export default function LoginPage() {
    const [name, setName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    // Sprawdzanie, czy użytkownik jest zalogowany
    useEffect(() => {
        const token = localStorage.getItem('jwt');
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const data = await login(name, password);
            console.log('Zalogowano pomyślnie:', data);
            setError(''); // Wyczyść błędy w przypadku sukcesu
        } catch (err: any) {
            setError(err); // Wyświetl komunikat błędu
        }
        window.location.reload();
    };
    const handleLogout = async () => {
        await logout();
        setIsLoggedIn(false);
        window.location.reload();
    };
    return (
        <div>
            <h1>{isLoggedIn ? 'Witaj, zalogowany!' : 'Strona logowania'}</h1>
            {isLoggedIn ? (
                <button onClick={handleLogout}>Wyloguj</button>
            ) : (
                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Hasło"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button id="login-button" type="submit">
                        Login
                    </button>
                </form>
            )}
            {error && <p>{error}</p>}
        </div>
    );
}