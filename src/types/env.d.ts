declare namespace NodeJS {
    interface ProcessEnv {
        PORT: string;
        MONGO_URL: string;
        ALLOWED_RARITY: string;
        ALLOWED_COLORS: string;
        JWT_SECRET: string;
        JWT_EXPIRATION: string;
        MQTT_URL_BACKEND: string;
        MQTT_LOGIN: string;
        MGTT_PASSWORD: string;
    }
}