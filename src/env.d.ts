declare namespace NodeJS {
    interface ProcessEnv {
        PORT: string; // The PORT variable is required and must be a string
        MONGO_URL: string; // Required database connection URL
        ALLOWED_RARITY: string;
        ALLOWED_COLORS: string;
        JWT_SECRET: string;
        JWT_EXPIRATION: string;
    }
}