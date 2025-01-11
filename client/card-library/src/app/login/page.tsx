'use client'
import { useState } from 'react';
export default function LoginPage() {
    const [name, setName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const login = await fetch(`https://localhost:8443/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, password }),
            });
            const data = await login.json();
            if (!data.ok) {
                const errorData = await login.json();
                throw new Error(errorData.message || 'Błąd logowania');
            };
            console.log('Zalogowano pomyślnie', data);
        } catch (error: any) {
            console.log(error);
            setError(error.message);
        }
    }
    return (
        <div>
            <h1>Strona logowania</h1>
            <form onSubmit={handleLogin}>
                <input
                    type="name"
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
                <button id="login-button" type='submit'>Login</button>
            </form>
        </div>
    );
}