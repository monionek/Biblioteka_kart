'use client';
import { useEffect, useState } from 'react';

export default function ChatPage() {
    const [messages, setMessages] = useState<{ username: string; content: string }[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [username, setUsername] = useState(''); // Pole na nazwę użytkownika

    useEffect(() => {
        if (username) {
            // Połącz z serwerem WebSocket po ustawieniu nazwy użytkownika
            const socket = new WebSocket('wss://localhost:8443/ws');
            setWs(socket);

            // Obsługa wiadomości przychodzących
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setMessages((prev) => [...prev, data]);
            };

            // Obsługa zamykania połączenia
            socket.onclose = () => {
                console.log('Połączenie zamknięte.');
            };

            // Czyszczenie połączenia
            return () => {
                socket.close();
            };
        }
    }, [username]); // Zainicjuj WebSocket tylko po ustawieniu nazwy użytkownika

    const sendMessage = () => {
        if (ws && inputValue) {
            const message = {
                username,
                content: inputValue,
            };
            ws.send(JSON.stringify(message));
            setInputValue('');
        }
    };

    return (
        <div>
            <h1>Next.js Chat</h1>
            {!username ? (
                <div>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Wpisz swoją nazwę użytkownika..."
                    />
                    <button onClick={() => username && setUsername(username)}>Dołącz</button>
                </div>
            ) : (
                <div>
                    <div>
                        {messages.map((message, index) => (
                            <div key={index}>
                                <strong>{message.username}:</strong> {message.content}
                            </div>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Wpisz wiadomość..."
                    />
                    <button onClick={sendMessage}>Wyślij</button>
                </div>
            )}
        </div>
    );
}