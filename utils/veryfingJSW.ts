import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv, { config } from "dotenv";

dotenv.config();

const verifyJWT = (req: Request, res: Response, next: Function) => {
    const rawToken = req.headers["authorization"];
    if (!rawToken) {
        res.status(401).json({ "message": "jsw token must be provided" })
    } else {
        const token = rawToken.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: "Token missing" });
        } else {
            const secret = process.env.JWT_SECRET;
            try {
                const decoded = jwt.verify(token, secret!) as { id: string; role: string; email: string };

                req.user = {
                    id: decoded.id,
                    role: decoded.role,
                    email: decoded.email,
                };

                next();
            } catch (error) {
                console.error(error);
                res.status(403).json({ message: "Invalid or expired token" });
            }
        };
    }
}