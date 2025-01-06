import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
    name: string;
    password: string;
    email: string;
    role: "admin" | "moderator" | "user";
}

const userSchema = new Schema<IUser>({
    name: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["admin", "moderator", "user"], default: "user" },
});

const User = mongoose.model<IUser>("users", userSchema);

export default User;
