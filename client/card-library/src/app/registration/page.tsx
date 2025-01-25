'use client';

import { useState } from "react";
import axiosInstance from "../utils/fetchWithAgent";

export default function RegisterPage() {
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [message, setMessage] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");

        try {
            const response = await axiosInstance.post("/users", {
                name,
                email,
                password,
            });

            if (response.status === 201) {
                setMessage(`Rejestracja udana: ${response.data.message}`);
                setName("");
                setEmail("");
                setPassword("");
            }
        } catch (error: any) {
            if (error.response && error.response.data) {
                setMessage(`Błąd: ${error.response.data.message}`);
            } else {
                setMessage("Wystąpił błąd podczas rejestracji.");
            }
            console.error("Unexpected error:", error);
        }
    };

    return (
        <div>
            <h1>Rejestracja</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="name">Imię:</label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <label htmlFor="password">Hasło:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">Zarejestruj się</button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
}
