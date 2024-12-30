import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
    id: string;
    name: string;
    email: string;
}

const userSchema = new Schema<IUser>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
});

const User = mongoose.model<IUser>("users", userSchema);

export default User;
