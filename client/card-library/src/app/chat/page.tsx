'use client';
import { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import dotenv from 'dotenv'
dotenv.config()

export default function ChatPage() {
    const [messages, setMessages] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [messageCount, setMessageCount] = useState<number>(0);  // Liczba wiadomości

    useEffect(() => {
        const token = localStorage.getItem('jwt');
        const socketUrl = token
            ? `wss://localhost:8443/ws?token=${token}`
            : `wss://localhost:8443/ws`;
        const socket = new WebSocket(socketUrl);

        setWs(socket);

        socket.onopen = () => {
            console.log('WebSocket connection established.');
        };

        socket.onmessage = (event) => {
            const message = event.data;
            setMessages((prev) => [...prev, message]);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = (event) => {
            console.log('WebSocket connection closed.', event.reason);
        };

        const mqttClient = mqtt.connect("wss://b8d4a9cd429f42bf87519d8748e76d77.s1.eu.hivemq.cloud:8884/mqtt", {
            username: 'Admin',
            password: 'Miodekplodek1',
        });

        mqttClient.on('connect', () => {
            console.log('Connected to MQTT broker');
            mqttClient.subscribe('chat/numberOfMessages', (err) => {
                if (err) {
                    console.error('Error subscribing to topic:', err);
                }
            });
        });

        mqttClient.on('message', (topic, message) => {
            if (topic === 'chat/numberOfMessages') {
                const newMessageCount = parseInt(message.toString(), 10);
                setMessageCount(newMessageCount);
            }
        });

        return () => {
            console.log('Cleaning up WebSocket and MQTT...');
            if (socket.readyState === WebSocket.OPEN || WebSocket.CONNECTING) {
                socket.close();
            }
            mqttClient.end();
        };
    }, []);

    const sendMessage = () => {
        if (ws && inputValue) {
            ws.send(inputValue);
            setInputValue('');
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Chat</h1>
            <div className="border p-4 rounded-lg mb-4 h-96 overflow-y-auto bg-gray-50">
                {messages.map((message, index) => (
                    <div key={index} className="mb-2">
                        <span>{message}</span>
                    </div>
                ))}
            </div>

            {/* Wyświetlanie liczby wiadomości */}
            <div className="mb-4">
                <p>Messages in the chat: {messageCount}</p>
            </div>

            <div className="flex">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Wpisz wiadomość..."
                    className="flex-grow border rounded-l-lg p-2"
                />
                <button
                    onClick={sendMessage}
                    className="bg-blue-500 text-white px-4 py-2 rounded-r-lg"
                >
                    Send Message
                </button>
            </div>
        </div>
    );
}
