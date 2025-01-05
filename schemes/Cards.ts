import mongoose, { Document, Schema } from 'mongoose';

interface ICard extends Document {
    name: string;
    rarity: string;
    color: string[];
    type: string;
    cost: Record<string, number>;
    attack: number;
    toughness: number;
    description: string;
}

const CardSchema = new Schema<ICard>({
    name: { type: String, required: true, unique: true },
    rarity: { type: String, required: true, unique: false },
    color: { type: [{ type: String }], required: true, unique: false },
    type: { type: String, required: true, unique: false },
    cost: { type: Object, required: true, unique: false },
    attack: { type: Number, required: false, unique: false },
    toughness: { type: Number, required: false, unique: false },
    description: { type: String, required: false, unique: false },
});

const Card = mongoose.model<ICard>("Card", CardSchema, "library");

export default Card;
