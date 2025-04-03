import mongoose, { Document, Schema } from 'mongoose';

interface IDeck extends Document {
    deckName: string;
    owner: string;
    cardList: string[];
}

const deckSchema = new Schema<IDeck>({
    deckName: { type: String, required: true, unique: false },
    owner: { type: String, required: true, unique: false },
    cardList: { type: [String], required: true, unique: false },
});

const Deck = mongoose.model<IDeck>("Deck", deckSchema, "decks");
export default Deck;
