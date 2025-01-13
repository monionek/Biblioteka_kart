"use client";

import { useState } from "react";
import axiosInstance from "../utils/fetchWithAgent";

type Deck = {
    deckName: string;
    cardList: Array<{ name: string; quantity: number }>;
    owner: string;
};

export default function DecksPage() {
    const [userSelector, setUserSelector] = useState<string>("");
    const [deckName, setDeckName] = useState<string>("");
    const [decks, setDecks] = useState<Deck[]>([]);
    const [deckDetails, setDeckDetails] = useState<Deck | null>(null);
    const [newDeckName, setNewDeckName] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSearchDecks = async () => {
        if (!userSelector.trim()) {
            setErrorMessage("Please enter a valid user name or email.");
            return;
        }

        setErrorMessage("");
        setIsLoading(true);

        try {
            const response = await axiosInstance.get(`/users/${encodeURIComponent(userSelector)}/decks`);
            setDecks(response.data);
        } catch (error) {
            console.error("Error fetching decks:", error);
            setErrorMessage("Failed to fetch decks. Please check the user and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateDeck = async () => {
        if (!newDeckName.trim()) {
            setErrorMessage("Please enter a valid deck name.");
            return;
        }

        setErrorMessage("");
        setSuccessMessage("");
        setIsLoading(true);

        try {
            // Pobierz token z localStorage lub innego źródła
            const token = localStorage.getItem("jwt");

            if (!token) {
                setErrorMessage("Unauthorized. Please log in to create a deck.");
                setIsLoading(false);
                return;
            }

            // Wykonaj żądanie z niestandardowymi nagłówkami
            const response = await axiosInstance.post(
                `/decks`,
                { deckname: newDeckName },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setSuccessMessage(response.data.message);
            setNewDeckName(""); // Wyczyść pole
        } catch (error: any) {
            if (error.response?.status === 401) {
                setErrorMessage("Unauthorized. Please log in to create a deck.");
            } else {
                setErrorMessage("Failed to create deck. Please try again.");
            }
            console.error("Error creating deck:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h1>User Decks</h1>

            {/* Search All Decks */}
            <div>
                <label htmlFor="userSelector">User Name or Email:</label>
                <input
                    type="text"
                    id="userSelector"
                    value={userSelector}
                    onChange={(e) => setUserSelector(e.target.value)}
                    placeholder="Enter user name or email"
                />
                <button onClick={handleSearchDecks} disabled={isLoading}>
                    {isLoading ? "Loading..." : "Search All Decks"}
                </button>
            </div>

            {/* Create New Deck */}
            <div>
                <label htmlFor="newDeckName">New Deck Name:</label>
                <input
                    type="text"
                    id="newDeckName"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder="Enter new deck name"
                />
                <button onClick={handleCreateDeck} disabled={isLoading}>
                    {isLoading ? "Loading..." : "Create Deck"}
                </button>
            </div>

            {/* Error and Success Messages */}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}

            {/* Display All Decks */}
            <div>
                <h2>All Decks</h2>
                {decks && decks.length > 0 ? (
                    <ul>
                        {decks.map((deck, index) => (
                            <li key={index}>
                                <strong>Name:</strong> {deck.deckName} | <strong>Owner:</strong> {deck.owner}
                            </li>
                        ))}
                    </ul>
                ) : (
                    !isLoading && <p>No decks found.</p>
                )}
            </div>
        </div>
    );
}
