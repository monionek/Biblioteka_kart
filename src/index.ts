import express, { Request, Response, NextFunction } from 'express';
import { param, validationResult, body, checkSchema } from 'express-validator';
import bodyParser, { json } from 'body-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from "../schemes/Users";
import Card from "../schemes/Cards";
import Deck from "../schemes/Decks";
import updatingCardValidationSchema from "../utils/updatingCardValidationSchema";
import creatingCardValidationSchema from "../utils/creatingCardValidationSchema";
import { createEmailChain, createNameChain, createPasswordChain } from "../utils/creatingUserChains";
import { hashPassword, verifyPassword } from "../utils/cryptingPassword";


const app = express();
dotenv.config();
const port = process.env.PORT || 3000;
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/CardLibrary";

mongoose.connect(mongoUrl).then(() => {
    console.log("DataBase connected")
}).catch((error) => {
    console.log(error)
})

app.use(express.json());

//CRUD usera
//dodawanie nowego użytkownika
app.post('/users', createEmailChain(), createNameChain(), createPasswordChain(), async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(500).json({ errors: errors.array() });
    } else {
        const { name, email, password } = req.body;
        const hashedPassword = await hashPassword(password);
        const newUser = new User({
            name: name,
            email: email,
            password: hashedPassword
        })
        await newUser.save().then(() => console.log("user saved")).catch((error) => console.log(error))
        res.status(201).json({ message: `new user created with name: ${newUser.name}` });
    }
}
);
//szukanie użytkownika po id lub nazwie
app.get('/users/:selector', async (req: Request, res: Response) => {
    const selector = req.params.selector;
    try {
        const foundUser = await User.findOne({
            $or: [{ name: selector }]
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
app.patch('/users/:selector', body('email').optional().isEmail().withMessage("Invalid Email Format"), async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(500).json({ errors: errors.array() });
    } else {
        const selector = decodeURIComponent(req.params.selector);
        try {
            const updatedUser = await User.findOneAndUpdate(
                { $or: [{ name: selector }, { email: { $regex: `^${selector}$`, $options: 'i' } }] },
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
    }
});


app.delete('/users/:selector', async (req: Request, res: Response) => {
    const selector = decodeURIComponent(req.params.selector);
    try {
        const deletedUser = await User.findOneAndDelete(
            { $or: [{ name: selector }, { email: { $regex: `^${selector}$`, $options: 'i' } }] },
        )
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
app.patch('/library/:name', updatingCardValidationSchema(), async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
    } else {
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
        const userSelector = decodeURIComponent(req.params.selector);
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
        }

        try {
            const findUser = await User.findOne({
                $or: [{ name: userSelector }, { email: { $regex: `^${userSelector}$`, $options: 'i' } }]
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
    const userSelector = decodeURIComponent(req.params.selector);
    const deckName = decodeURIComponent(req.params.deckname);
    try {
        // Szukaj użytkownika po nazwie lub id
        const findUser = await User.findOne({
            $or: [{ name: userSelector }, { email: { $regex: `^${userSelector}$`, $options: 'i' } }]
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
    const userSelector = decodeURIComponent(req.params.selector);
    try {
        // Szukaj użytkownika po nazwie lub id
        const findUser = await User.findOne({
            $or: [{ name: userSelector }, { email: { $regex: `^${userSelector}$`, $options: 'i' } }],
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
// Dodawanie kart do talii
app.patch('/users/:selector/decks/:deckname/add-cards',
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
        } else {
            const userSelector = decodeURIComponent(req.params.selector);
            try {
                const findUser = await User.findOne({
                    $or: [{ name: userSelector }, { email: { $regex: `^${userSelector}$`, $options: 'i' } }]
                });

                if (findUser) {
                    const findDeck = await Deck.findOne({ deckName: req.params.deckname, owner: findUser.name });

                    if (findDeck) {
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
                    } else {
                        res.status(404).json({ message: "Deck not found" });
                    }
                } else {
                    res.status(404).json({ message: "User not found" });
                }
            } catch (error) {
                console.error("Error adding cards:", error);
                res.status(500).json({ message: "An error occurred while adding cards" });
            }
        }
    }
);
// Usuwanie kart z talii
app.patch('/users/:selector/decks/:deckname/remove-cards',
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

        const userSelector = decodeURIComponent(req.params.selector);
        try {
            const findUser = await User.findOne({
                $or: [{ name: userSelector }, { email: { $regex: `^${userSelector}$`, $options: 'i' } }]
            });

            if (findUser) {
                const findDeck = await Deck.findOne({ deckName: req.params.deckname, owner: findUser.name });

                if (findDeck) {
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
                } else {
                    res.status(404).json({ message: "Deck not found" });
                }
            } else {
                res.status(404).json({ message: "User not found" });
            }
        } catch (error) {
            console.error("Error removing cards:", error);
            res.status(500).json({ message: "An error occurred while removing cards" });
        }
    }
);

//Delete deck
app.delete('/users/:selector/decks/:deckname', async (req: Request, res: Response) => {
    const userSelector = decodeURIComponent(req.params.selector);
    const deckName = decodeURIComponent(req.params.deckname);
    try {
        const findUser = await User.findOne({
            $or: [{ name: userSelector }, { email: { $regex: `^${userSelector}$`, $options: 'i' } }]
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
//user login
app.post('/users/login', async (req: Request, res: Response) => {
    const { name, password } = req.body;

    try {
        const user = await User.findOne({ name });
        if (!user) {
            res.status(404).json({ message: "User not found" });
        } else {
            const isPasswordValid = await verifyPassword(password, user.password)
            if (!isPasswordValid) {
                res.status(401).json({ message: "Invalid password" });
            } else {
                const token = jwt.sign(
                    { id: user._id, email: user.email },
                    process.env.JWT_SECRET!,
                    { expiresIn: process.env.JWT_EXPIRATION || '1h' }
                );
                res.status(200).json({ message: "Login successful", token });
            }
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "An error occurred during login" });
    }
});
//uruchamianie aplikacji
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
