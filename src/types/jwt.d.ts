import { JwtPayload } from 'jsonwebtoken';

declare module 'jsonwebtoken' {
    export interface MyJwtPayload extends JwtPayload {
        id: string;
        role: string;
        name: string;
    }
}