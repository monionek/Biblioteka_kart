import express, { Request, Response } from 'express';
import { param, validationResult, body, checkSchema } from 'express-validator';
import bodyParser, { json } from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from "../schemes/Users";
import Card from "../schemes/Cards";
import Deck from "../schemes/Decks";

const app = express();
dotenv.config();
const port = process.env.PORT || 3000;
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/CardLibrary";
const rarityTable = process.env.ALLOWED_RARITY
    ? process.env.ALLOWED_RARITY.split(",")
    : ["common", "uncommon", "rare", "mythic"];

const colorTable = process.env.ALLOWED_COLORS
    ? process.env.ALLOWED_COLORS.split(",")
    : ["colorless", "red", "blue", "white", "black", "green"];

mongoose.connect(mongoUrl).then(() => {
    console.log("DataBase connected")
}).catch((error) => {
    console.log(error)
})

app.use(express.json());
console.log(rarityTable);
console.log(colorTable);
const createEmailChain = () => body('email').isEmail().withMessage("invalid email").custom(async value => {
    const user = await User.findOne({ email: value })
    if (user) {
        throw new Error('E-mail already in use');
    }
});

const createNameChain = () => body('name').notEmpty().withMessage("Name must be required").isString().withMessage("Must be String only");

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
                    return true
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
                    return true
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

// dodawanie karty dziala
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
                console.log("card added to library")
                res.status(201).json({ message: `new card added to library card:${newCard}` })
            } else {
                console.log("card not added to library")
                res.status(500).json({ message: "An error occurred while adding card to library" });
            }
        } catch (error) {
            console.error("Error adding card to library:", error);
            res.status(500).json({ message: "An error occurred while adding card to library" });
        }
    }
});
// pobranie karty dziala
app.get('/library/:selector', async (req: Request, res: Response) => {
    const selector = req.params.selector;


    const numericSelector = parseInt(selector);

    try {
        // Build the query dynamically based on the type of the selector
        const query: any = {
            $or: []
        };

        // If the selector is a number (check if it's a valid number for attack or toughness)
        if (!isNaN(numericSelector)) {
            query.$or.push(
                { attack: numericSelector },
                { toughness: numericSelector }
            );
        }

        // Add string-based search for name and rarity (case-insensitive)
        // Ensure the regex works with multiple words, including whitespaces
        query.$or.push(
            { name: { $regex: new RegExp(selector, 'i') } },
            { rarity: { $regex: new RegExp(selector, 'i') } }
        );

        // Perform the query
        const foundedCards = await Card.find(query);

        // Return the response based on the search result
        if (foundedCards.length !== 0) {
            res.status(200).json(foundedCards);
        } else {
            res.status(404).json({ message: "Card not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while searching for the card" });
    }
});
//modyfikowanie karty
app.patch('/library/:name', async (req: Request, res: Response) => {
    const cardName = decodeURIComponent(req.params.name);
    try {
        const updatedCard = await Card.findOneAndUpdate(
            { name: cardName },
            { $set: { ...req.body } }, // Przekazujesz całe body zamiast ręcznie ustawiać pola
            { new: true }
        );

        if (updatedCard) {
            console.log("card updated")
            res.status(200).json({ message: "Card data modified", card: updatedCard });
        } else {
            console.log("card to update not found")
            res.status(404).json({ message: "Card not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while updating the Card" });
    }
})

// //usuwanie karty
app.delete('/library/:name', async (req: Request, res: Response) => {
    const cardName = decodeURIComponent(req.params.name);
    try {
        const deletedCard = await Card.findOneAndDelete({ name: cardName })
        if (deletedCard) {
            console.log("card Deleted")
            res.status(200).json({ message: "Card Deleted" });
        } else {
            console.log("card to delete not found")
            res.status(404).json({ message: "Card not found" });
        }
    } catch (error) {
        console.error("Error deleting card:", error);
        res.status(500).json({ message: "An error occurred while deleting the card" });
    }
})
//CRUD talii
//adding new deck
app.post(
    '/users/:selector/decks',
    body('deckname')
        .notEmpty().withMessage("deckname must be provided")
        .isString().withMessage("deckname must be a string"),
    async (req: Request, res: Response) => {
        const userSelector = req.params.selector;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
        }

        if (!userSelector) {
            res.status(400).json({ message: "User selector cannot be empty" });
        }

        try {
            const findUser = await User.findOne({
                $or: [{ name: userSelector }, { id: userSelector }]
            });

            if (findUser) {
                const newDeck = new Deck({
                    deckName: req.body.deckname, // Poprawione na body
                    owner: findUser.name,
                    cardList: []
                });

                const saveDeck = await newDeck.save();

                if (saveDeck) {
                    res.status(201).json({
                        message: `New deck created: ${newDeck.deckName}, for user: ${findUser.name}`
                    });
                } else {
                    res.status(500).json({ message: "An error occurred while creating deck" });
                }
            } else {
                res.status(404).json({ message: "User not found" });
            }
        } catch (error) {
            console.error("Error creating deck:", error);
            res.status(500).json({ message: "An error occurred while creating deck" });
        }
    }
);

//searching one deck of a user
app.get('/users/:selector/decks/:deckname', async (req: Request, res: Response) => {
    const userSelector = req.params.selector;
    const deckName = decodeURIComponent(req.params.deckname);
    try {
        // Szukaj użytkownika po nazwie lub id
        const findUser = await User.findOne({
            $or: [{ name: userSelector }, { id: userSelector }]
        });

        if (findUser) {
            // Szukaj talii po nazwie deckname
            const findDeck = await Deck.findOne({ deckName: deckName, owner: findUser.name });

            if (findDeck) {
                // Zwróć znalezioną talię
                res.status(200).json(findDeck.cardList);
            } else {
                // Jeśli nie znaleziono talii
                res.status(404).json({ message: "Deck not found" });
            }
        } else {
            // Jeśli nie znaleziono użytkownika
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Error searching deck:", error);
        res.status(500).json({ message: "An error occurred while searching deck" });
    }
});

//Searching all decks of user
app.get('/users/:selector/decks', async (req: Request, res: Response) => {
    const userSelector = req.params.selector;
    try {
        // Szukaj użytkownika po nazwie lub id
        const findUser = await User.findOne({
            $or: [{ name: userSelector }, { id: userSelector }]
        });

        if (findUser) {
            const findDeck = await Deck.find({ owner: findUser.name });

            if (findDeck.length > 0) {
                res.status(200).json(findDeck);
            } else {
                res.status(404).json({ message: "Decks not found" });
            }
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Error searching decks:", error);
        res.status(500).json({ message: "An error occurred while searching decks" });
    }
});
//modyfing cardlist inside a deck
app.patch('/users/:selector/decks/:deckname',
    body('adding')
        .notEmpty().withMessage("do you want to remove or add card? Add 'adding: true/false' to your req body")
        .isBoolean().withMessage("Boolean must be provided in 'adding: true/false'"),

    body('cardlist')
        .isArray().withMessage("card list must be provided in an array")
        .custom((value) => {
            if (value && !value.every((element: string) => typeof element === 'string')) {
                throw new Error("All items in the card list must be strings");
            }
            return true;
        }),

    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
        }

        const userSelector = req.params.selector;
        try {
            const findUser = await User.findOne({
                $or: [{ name: userSelector }, { id: userSelector }]
            });

            if (findUser) {
                const findDeck = await Deck.findOne({ deckName: req.params.deckname, owner: findUser.name });

                if (findDeck) {
                    // Adding cards
                    if (req.body.adding && Array.isArray(req.body.cardlist)) {
                        const addPromises = req.body.cardlist.map(async (element: string) => {
                            const findCard = await Card.findOne({ name: element });
                            if (findCard) {
                                findDeck.cardList.push(element);
                            } else {
                                console.log(`Card "${element}" not found`);
                            }
                        });

                        await Promise.all(addPromises);
                        await findDeck.save();
                        res.status(200).json({ message: "Cards added successfully", cardList: findDeck.cardList });
                    }

                    // Removing cards
                    else if (!req.body.adding && Array.isArray(req.body.cardlist)) {
                        for (const element of req.body.cardlist) {
                            const cardIndex = findDeck.cardList.indexOf(element);
                            if (cardIndex > -1) {
                                findDeck.cardList.splice(cardIndex, 1);
                            } else {
                                console.log(`Card "${element}" does not exist in the deck`);
                            }
                        }

                        await findDeck.save();
                        res.status(200).json({ message: "Cards removed successfully", cardList: findDeck.cardList });
                    }

                    // If cardlist is missing or incorrectly formatted
                    else {
                        res.status(400).json({ message: "Invalid request. `cardlist` must be an array of strings." });
                    }
                } else {
                    res.status(404).json({ message: "Deck not found" });
                }
            } else {
                res.status(404).json({ message: "User not found" });
            }
        } catch (error) {
            console.error("Error searching deck:", error);
            res.status(500).json({ message: "An error occurred while searching deck" });
        }
    });
//Delete deck
app.delete('/users/:selector/decks/:deckname', async (req: Request, res: Response) => {
    const userSelector = req.params.selector;
    const deckName = decodeURIComponent(req.params.deckname);
    try {
        const findUser = await User.findOne({
            $or: [{ name: userSelector }, { id: userSelector }]
        });

        if (findUser) {

            const findDeck = await Deck.findOneAndDelete({ deckName: deckName, owner: findUser.name });

            if (findDeck) {
                res.status(204).json(findDeck.cardList);
            } else {
                res.status(404).json({ message: "Deck not found" });
            }
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Error searching deck:", error);
        res.status(500).json({ message: "An error occurred while searching deck" });
    }
});
//uruchamianie aplikacji
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
