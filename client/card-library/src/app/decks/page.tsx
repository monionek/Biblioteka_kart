"use client";

import { useState } from "react";
import axiosInstance from "../utils/fetchWithAgent";

type Deck = {
    deckName: string;
    cardList: string[];
    owner: string;
};

export default function DecksPage() {
    const [searchInput, setSearchInput] = useState<string>("");
    const [searchMode, setSearchMode] = useState<string>("deckName"); // Tryb wyszukiwania: "deckName" lub "owner"
    const [decks, setDecks] = useState<Deck[]>([]);
    const [newDeckName, setNewDeckName] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");

    const handleDeleteDeck = async (deckName: string) => {
        try {
            const encodedDeckName = encodeURIComponent(deckName);

            const response = await axiosInstance.delete(
                `/decks/${encodedDeckName}`,
                {
                    withCredentials: true
                }
            );

            setSuccessMessage(response.data.message);
            setNewDeckName("");
        } catch (error) {
            console.log(error);
        }
    };
    const handleSearchDecks = async () => {
        if (!searchInput.trim()) {
            setErrorMessage("Please enter a valid input.");
            return;
        }

        setErrorMessage("");
        setDecks([]);

        try {
            if (searchMode === "deckName") {
                const deckResponse = await axiosInstance.get(`/decks/${encodeURIComponent(searchInput)}`);
                setDecks(deckResponse.data);
            } else if (searchMode === "owner") {
                const userResponse = await axiosInstance.get(`/users/${encodeURIComponent(searchInput)}/decks`);
                setDecks(userResponse.data);
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                setErrorMessage("No decks or user found for the provided input.");
            } else {
                setErrorMessage("An error occurred while searching for decks.");
            }
        }
    };

    const handleCreateDeck = async () => {
        if (!newDeckName.trim()) {
            setErrorMessage("Please enter a valid deck name.");
            return;
        }

        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response = await axiosInstance.post(
                `/decks`,
                { deckName: newDeckName },
                {
                    withCredentials: true
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
        }
    };

    return (
        <div>
            <h1>Search and Manage Decks</h1>

            {/* Search All Decks or User's Decks */}
            <div>
                <label htmlFor="searchMode">Search by:</label>
                <select
                    id="searchMode"
                    value={searchMode}
                    onChange={(e) => setSearchMode(e.target.value)}
                >
                    <option value="deckName">Deck Name</option>
                    <option value="owner">Deck Owner</option>
                </select>

                <label htmlFor="searchInput">Search Input:</label>
                <input
                    type="text"
                    id="searchInput"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={`Enter ${searchMode === "deckName" ? "deck name" : "owner name"}`}
                />
                <button onClick={handleSearchDecks}>Search Decks</button>
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
                <button onClick={handleCreateDeck}>Create Deck</button>
            </div>

            {/* Error and Success Messages */}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}

            {/* Display All Decks */}
            <div>
                <h2>Search Results</h2>
                {decks.length > 0 ? (
                    <ul>
                        {decks.map((deck, index) => (
                            <li key={index}>
                                <strong>Name:</strong> {deck.deckName} | <strong>Owner:</strong> {deck.owner}
                                <div>
                                    <strong>Card List:</strong>
                                    {deck.cardList.length > 0 ? (
                                        <ul>
                                            {deck.cardList.map((card, cardIndex) => (
                                                <li key={cardIndex}>{card}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>No cards in this deck.</p>
                                    )}
                                </div>
                                <button id="delete-deck-button" onClick={() => handleDeleteDeck(deck.deckName)}>Delete</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No decks found.</p>
                )}
            </div>
        </div>
    );
}
