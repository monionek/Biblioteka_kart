'use client';
import axiosInstance from "@/app/utils/fetchWithAgent";
import { useState } from "react";

type Card = {
    name: string;
    rarity: string;
    color: string[];
    type: string;
    cost: Record<string, number>;
    attack?: number;
    toughness?: number;
    description: string;
};

export default function CardForm() {
    const rarities = ["common", "uncommon", "rare", "mythic"];
    const colors = ["colorless", "red", "blue", "white", "black", "green"];
    const types = ["creature", "spell"];

    const [formType, setFormType] = useState<string>("creature");
    const [name, setName] = useState<string>("");
    const [rarity, setRarity] = useState<string>(rarities[0]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [cost, setCost] = useState<Record<string, number>>({});
    const [attack, setAttack] = useState<number>(0);
    const [toughness, setToughness] = useState<number>(0);
    const [description, setDescription] = useState<string>("");

    const handleColorChange = (color: string) => {
        setSelectedColors((prev) =>
            prev.includes(color)
                ? prev.filter((c) => c !== color) // Usuń, jeśli już istnieje
                : [...prev, color] // Dodaj, jeśli nie istnieje
        );
    };

    const handleCostChange = (color: string, value: string) => {
        setCost((prev) => ({
            ...prev,
            [color]: Math.max(0, Number(value)) || 0, // Zapewnij, że koszt nie jest ujemny
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const newCard: Card = {
                name,
                rarity,
                color: selectedColors,
                type: formType,
                cost,
                description,
            };

            if (formType === "creature") {
                newCard.attack = attack;
                newCard.toughness = toughness;
            }
            const token = localStorage.getItem("jwt");
            if (!token) {
                console.error("No token found.");
                return false;
            }
            const response = await axiosInstance.post("/library", newCard, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.status === 201) {
                console.log("dodana")
            } else {
                console.log("nie dodana")
            }
            console.log(newCard);
        } catch (error) {
            console.log(error)
        }
    };

    return (
        <div>
            <h1>Create a Card</h1>

            {/* Form Type Selector */}
            <label htmlFor="form-type">Select Card Type:</label>
            <select
                id="form-type"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
            >
                {types.map((type) => (
                    <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                ))}
            </select>

            <form onSubmit={handleSubmit}>
                {/* Name */}
                <label htmlFor="card-name">Name:</label>
                <input
                    id="card-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                {/* Rarity */}
                <label htmlFor="card-rarity">Rarity:</label>
                <select
                    id="card-rarity"
                    value={rarity}
                    onChange={(e) => setRarity(e.target.value)}
                    required
                >
                    {rarities.map((r) => (
                        <option key={r} value={r}>
                            {r}
                        </option>
                    ))}
                </select>

                {/* Colors */}
                <fieldset>
                    <legend>Colors:</legend>
                    {colors.map((color) => (
                        <label key={color}>
                            <input
                                type="checkbox"
                                value={color}
                                checked={selectedColors.includes(color)}
                                onChange={() => handleColorChange(color)}
                            />
                            {color}
                        </label>
                    ))}
                </fieldset>

                {/* Cost */}
                <fieldset>
                    <legend>Cost:</legend>
                    {colors.map((color) => (
                        <div key={color}>
                            <label htmlFor={`cost-${color}`}>{color}:</label>
                            <input
                                id={`cost-${color}`}
                                type="number"
                                value={cost[color] || 0}
                                onChange={(e) => handleCostChange(color, e.target.value)}
                                min="0"
                            />
                        </div>
                    ))}
                </fieldset>

                {/* Conditional Fields for Creature */}
                {formType === "creature" && (
                    <>
                        <label htmlFor="card-attack">Attack:</label>
                        <input
                            id="card-attack"
                            type="number"
                            value={attack}
                            onChange={(e) => setAttack(Math.max(0, Number(e.target.value)))}
                            min="0"
                        />

                        <label htmlFor="card-toughness">Toughness:</label>
                        <input
                            id="card-toughness"
                            type="number"
                            value={toughness}
                            onChange={(e) =>
                                setToughness(Math.max(0, Number(e.target.value)))
                            }
                            min="0"
                        />
                    </>
                )}

                {/* Description */}
                <label htmlFor="card-description">Description:</label>
                <textarea
                    id="card-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                {/* Submit Button */}
                <button type="submit">Create Card</button>
            </form>
        </div>
    );
}
