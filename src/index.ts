import express, { Request, Response } from 'express';
import { param, validationResult, body, checkSchema } from 'express-validator';
import bodyParser, { json } from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from "../schemes/Users";
import Card from "../schemes/Cards";

const app = express();
dotenv.config();
const port = process.env.PORT || 3000;
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/CardLibrary";
const rarityTable = process.env.ALLOWED_RARITY.split(",") || ["common", "uncommon", "rare", "mythic"];
const colorTable = process.env.ALLOWED_RARITY.split(",") || ["common", "uncommon", "rare", "mythic"];

mongoose.connect(mongoUrl).then(() => {
    console.log("DataBase connected")
}).catch((error) => {
    console.log(error)
})

app.use(express.json());

const createEmailChain = () => body('email').isEmail().withMessage("invalid email").custom(async value => {
    const user = await User.findOne({ email: value })
    if (user) {
        throw new Error('E-mail already in use');
    }
});

const createNameChain = () => body('name').notEmpty().withMessage("Name must be required").isString().withMessage("Must be String only");

// const createCardChain = () => {
//     body('name').notEmpty().withMessage("Name must be provided").isString().withMessage("Name must me a String").custom(async value => {
//         const card = await Card.findOne({ name: value })
//         if (card) {
//             throw new Error('There is already card with this name')
//         }
//     }),
//     body('rarity').notEmpty().withMessage("rarity must be provided").isIn(rarityTable).withMessage("Invalid rarity"),
//     body('color').notEmpty().withMessage("color must be provided").isIn(colorTable).withMessage("invalid color")
// }
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
            isNumeric: {
                errorMessage: "attack need to be a number"
            },
            custom: {
                options: (value) => {
                    if (value < 0) {
                        throw new Error("attack can't be negative")
                    }
                }
            }
        },
        toughness: {
            isNumeric: {
                errorMessage: "toughness need to be a number"
            },
            custom: {
                options: (value) => {
                    if (value <= 0) {
                        throw new Error("toughness can't be less than 0")
                    }
                }
            }
        },
        description: {
            optional: true,
            isString: true
        }
    }, ['body'])
}
const updatingCardValidationSchema = () => {
    return checkSchema({
        name: {
            optional: true,
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
                }
            }
        },
        rarity: {
            optional: true,
            isIn: {
                options: [rarityTable],
                errorMessage: "Invalid card rarity"
            }
        },
        color: {
            optional: true,
            isArray: {
                options: { min: 1 },
                errorMessage: "At least one color must be provided"
            },
            custom: {
                options: (colors) => {
                    if (!colors.every((color: string) => colorTable.includes(color))) {
                        throw new Error("Invalid color provided")
                    }
                }
            }
        },
        type: {
            optional: true,
            isString: true
        },
        cost: {
            optional: true,
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
                }
            }
        },
        description: {
            optional: true,
            isString: true
        }
    }, ['body'])
}
//CRUD usera
//dodawanie nowego użytkownika
app.post('/users', createEmailChain(), createNameChain(), async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(500).json({ errors: errors.array() });
    } else {
        const { name, email } = req.body;
        const newUser = new User({
            id: uuidv4(),
            name: name,
            email: email
        })
        await newUser.save().then(() => console.log("user saved")).catch((error) => console.log(error))
        res.status(201).json({ message: `new user created with id: ${newUser.id}` });
    }
});
//szukanie użytkownika po id lub nazwie
app.get('/users/:selector', async (req: Request, res: Response) => {
    const selector = req.params.selector;
    try {
        const foundUser = await User.findOne({
            $or: [{ id: selector }, { name: selector }]
        })
        if (foundUser) {
            res.status(200).json(foundUser)
        } else {
            res.status(404).json({ message: "user not found" })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while searching user" });
    }
});

//modyfikowanie użytkownika
app.patch('/users/:id', body('email').optional().isEmail().withMessage("Invalid Email Format"), async (req: Request, res: Response) => {
    const userId = req.params.id;

    try {
        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            {
                $set: {
                    name: req.body.name,
                    email: req.body.email
                }
            },
            { new: true }
        );

        if (updatedUser) {
            res.status(200).json({ message: "User data modified", user: updatedUser });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while updating the user" });
    }
});


app.delete('/users/:id', async (req: Request, res: Response) => {
    const userId = req.params.id;
    try {
        const deletedUser = await User.findOneAndDelete({ id: userId })
        if (deletedUser) {
            res.status(200).json({ message: "User Deleted" });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "An error occurred while deleting the user" });
    }
})

//CRUD kart

// dodawanie karty
app.post('/library', creatingCardValidationSchema(), async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
    } else {
        const { name, rarity, color, type, cost, attack, toughness, description } = req.body;
        const newCard = new Card({
            name: name,
            rarity: rarity,
            color: color,
            type: type,
            cost: cost,
            attack: attack,
            toughness: toughness,
            description: description,
        })
        try {
            const savedCard = await newCard.save()
            if (savedCard) {
                res.status(201).json({ message: `new card added to library card:${newCard}` })
            } else {
                res.status(500).json({ message: "An error occurred while adding card to library" });
            }
        } catch (error) {
            console.error("Error adding card to library:", error);
            res.status(500).json({ message: "An error occurred while adding card to library" });
        }
    }
});
// pobranie karty
app.get('/library/:selector', async (req: Request, res: Response) => {
    const selector = req.params.selector;
    try {
        const foundedCards = await Card.find({
            $or: [{ name: selector }, { rarity: selector }, { attack: selector }, { toughness: selector }]
        })
        if (foundedCards.length != 0) {
            res.status(200).json(foundedCards)
        } else {
            res.status(404).json({ message: "card not found" })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while searching card" });
    }
});
//modyfikowanie karty
app.patch('/library/:name', async (req: Request, res: Response) => {
    const cardName = req.params.name;
    try {
        const updatedCard = await User.findOneAndUpdate(
            { name: cardName },
            {
                $set: {
                    name: req.body.name,
                    rarity: req.body.rarity,
                    color: req.body.color,
                    type: req.body.type,
                    cost: req.body.cost,
                    attack: req.body.attack,
                    toughness: req.body.toughness,
                    description: req.body.description
                }
            },
            { new: true }
        );

        if (updatedCard) {
            res.status(200).json({ message: "Card data modified", card: updatedCard });
        } else {
            res.status(404).json({ message: "Card not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while updating the Card" });
    }
})

// //usuwanie karty
app.delete('/users/:name', async (req: Request, res: Response) => {
    const cardName = req.params.name;
    try {
        const deletedCard = await User.findOneAndDelete({ name: cardName })
        if (deletedCard) {
            res.status(200).json({ message: "Card Deleted" });
        } else {
            res.status(404).json({ message: "Card not found" });
        }
    } catch (error) {
        console.error("Error deleting card:", error);
        res.status(500).json({ message: "An error occurred while deleting the card" });
    }
})
//CRUD talii

//uruchamianie aplikacji
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
