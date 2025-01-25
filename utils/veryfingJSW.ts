import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config();

const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) {
        res.status(401).json({ error: 'Brak tokena!' });
        return
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            id: string;
            role: string;
            name: string;
        };

        req.user = {
            id: decoded.id,
            role: decoded.role,
            name: decoded.name,
        };

        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        res.status(403).json({ error: 'Nieprawidłowy lub wygasły token!' });
        return
    }
};

export default verifyJWT;