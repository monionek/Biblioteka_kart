'use client';
import { useState } from "react";
import { getCards, deleteCard } from "../utils/CardOperations";

type Card = {
    name: string;
    rarity: string;
    color: string[];
    type: string;
    cost: Record<string, number>;
    attack: number;
    toughness: number;
    description: string;
};

export default function Library() {
    const [searchQuery, setSearchQuery] = useState<string>("name");
    const [searchValue, setSearchValue] = useState<string>("");
    const [cards, setCards] = useState<Card[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!searchValue.trim()) {
            setErrorMessage("Please enter a search value.");
            return;
        }
        setErrorMessage("");

        try {
            // Przekazywanie searchQuery i searchValue do getCards
            const result = await getCards(searchQuery, searchValue);

            if (result.length === 0) {
                setErrorMessage("No cards found.");
            } else {
                setCards(result);
            }
        } catch (error) {
            console.error(error);
            setErrorMessage("Unexpected error occurred.");
        }
    };
    const handleDelete = async (name: string) => {
        try {
            const deleted = await deleteCard(name)
            if (deleted) {
                console.log("card deleted");
                window.location.reload();
            } else {
                console.log("failed to delete card");
            }
        } catch (error) {
            console.error("Error in handleDelete:", error);
        }
    }
    return (
        <div>
            <h1>Library</h1>
            <form id="card-search" onSubmit={handleSearch}>
                <label htmlFor="card-search-query">Search card by:</label>
                <select
                    id="card-search-query"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                >
                    <option value="name">name</option>
                    <option value="rarity">rarity</option>
                </select>

                <label htmlFor="card-search-value">Value:</label>
                <input
                    type="text"
                    id="card-search-value"
                    placeholder="Search value..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />
                <button id="get-card-button" type="submit">Search</button>
            </form>

            <p className="error-message" aria-live="polite">{errorMessage}</p>

            <div id="display-cards">
                {cards && cards.length > 0 ? (
                    <ul>
                        {cards.map((card, index) => (
                            <li key={index}>
                                <strong>Name:</strong> {card.name} |{" "}
                                <strong>Rarity:</strong> {card.rarity} |{" "}
                                <strong>Color:</strong> {card.color.join(", ")} |{" "}
                                <strong>Type:</strong> {card.type} |{" "}
                                <strong>Cost:</strong> {Object.entries(card.cost)
                                    .map(([key, value]) => `${value} ${key}`)
                                    .join(", ")} |{" "}
                                <strong>Attack:</strong> {card.attack} |{" "}
                                <strong>Toughness:</strong> {card.toughness} |{" "}
                                <strong>Description:</strong> {card.description}
                                <button id="delete_card_button" onClick={() => handleDelete(card.name)}>Delete</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    !errorMessage && <p>No cards to display.</p>
                )}
            </div>
        </div>
    );
}
