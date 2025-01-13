'use client';
import { useState } from "react";
import { getCards } from "../utils/CardOperations";

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
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!searchValue.trim()) {
            setErrorMessage("Please enter a search value.");
            return;
        }
        setErrorMessage("");
        setIsLoading(true);

        try {
            const result = await getCards(searchValue);
            if (result.length === 0) {
                setErrorMessage("No cards found.");
            } else {
                setCards(result);
            }
        } catch (error) {
            console.error(error);
            setErrorMessage("Unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

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
                    <option value="toughness">toughness</option>
                    <option value="attack">attack</option>
                </select>

                <label htmlFor="card-search-value">Value:</label>
                <input
                    type="text"
                    id="card-search-value"
                    placeholder="Search value..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />
                <button id="get-card-button" type="submit" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Search"}
                </button>
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