import { checkSchema } from 'express-validator';
import Card from "../schemes/Cards";
import dotenv from 'dotenv';
dotenv.config();
const port = process.env.PORT || 3000;
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/CardLibrary";
const rarityTable = process.env.ALLOWED_RARITY
    ? process.env.ALLOWED_RARITY.split(",")
    : ["common", "uncommon", "rare", "mythic"];

const colorTable = process.env.ALLOWED_COLORS
    ? process.env.ALLOWED_COLORS.split(",")
    : ["colorless", "red", "blue", "white", "black", "green"];

const creatingCardValidationSchema = () => {
    return checkSchema({
        name: {
            isString: true,
            notEmpty: {
                errorMessage: "Name is required"
            },
            custom: {
                options: async (name) => {
                    const card = await Card.findOne({ name });
                    if (card) {
                        throw new Error("A card with this name already exist")
                    }
                    return true
                }
            }
        },
        rarity: {
            isIn: {
                options: [rarityTable],
                errorMessage: "Invalid card rarity"
            }
        },
        color: {
            isArray: {
                options: { min: 1 },
                errorMessage: "At least one color must be provided"
            },
            custom: {
                options: (colors) => {
                    if (!colors.every((color: string) => colorTable.includes(color))) {
                        throw new Error("Invalid color provided")
                    }
                    return true
                }
            }
        },
        type: {
            isString: true
        },
        cost: {
            isObject: true,
        },
        attack: {
            optional: true,
            isNumeric: {
                errorMessage: "attack need to be a number"
            },
            custom: {
                options: (value) => {
                    if (value < 0) {
                        throw new Error("attack can't be negative")
                    }
                    return true
                }
            }
        },
        toughness: {
            optional: true,
            isNumeric: {
                errorMessage: "toughness need to be a number"
            },
            custom: {
                options: (value) => {
                    if (value <= 0) {
                        throw new Error("toughness can't be less than 0")
                    }
                    return true
                }
            }
        },
        description: {
            optional: true,
            isString: true
        }
    }, ['body'])
}
export default creatingCardValidationSchema;