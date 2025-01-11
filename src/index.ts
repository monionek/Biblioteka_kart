import express, { Request, Response, NextFunction } from 'express';
import { param, validationResult, body, checkSchema } from 'express-validator';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import https from 'https';
import User from "../schemes/Users";
import Card from "../schemes/Cards";
import Deck from "../schemes/Decks";
import updatingCardValidationSchema from "../utils/updatingCardValidationSchema";
import creatingCardValidationSchema from "../utils/creatingCardValidationSchema";
import { createEmailChain, createNameChain, createPasswordChain } from "../utils/creatingUserChains";
import { hashPassword, verifyPassword } from "../utils/cryptingPassword";
import verifyJWT from '../utils/veryfingJSW';

const app = express();
dotenv.config();
const port = process.env.PORT || 8443;
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017/CardLibrary";
const privateKey = fs.readFileSync('src/ssl/private.key', 'utf8');
const certificate = fs.readFileSync('src/ssl/certificate.crt', 'utf8');
const ca = fs.readFileSync('src/ssl/csr.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate, ca: ca };

mongoose.connect(mongoUrl).then(() => {
    console.log("DataBase connected");
}).catch((error) => {
    console.log(error);
})

app.use(express.json());

//CRUD user
//adding new users
app.post('/users', createEmailChain(), createNameChain(), createPasswordChain(), async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log('Validation error');
        res.status(400).json({ errors: errors.array() });
    } else {
        const { name, email, password } = req.body;
        try {
            const hashedPassword = await hashPassword(password);
            const newUser = new User({
                name: name,
                email: email,
                password: hashedPassword
            });
            const savedUser = await newUser.save();
            if (savedUser) {
                console.log('user created');
                res.status(201).json({ message: `new user created with name: ${newUser.name}` });
            } else {
                console.log(`couldn't create new user`);
                res.status(400).json({ message: `couldn't create new user` });
            }
        } catch (error) {
            console.log('error while creating user', error);
            res.status(500).json({ message: `Error while creating new user` });
        }
    }
}
);
//searching user by name or email
app.get('/users/:selector', async (req: Request, res: Response) => {
    const selector = req.params.selector;
    try {
        const foundUser = await User.findOne({
            $or: [{ name: selector }]
        });
        if (foundUser) {
            console.log('user found');
            res.status(200).json(foundUser);
        } else {
            console.log('user not found');
            res.status(404).json({ message: "user not found" });
        }
    } catch (error) {
        console.error('error while searching user ', error);
        res.status(500).json({ message: "An error occurred while searching user" });
    }
});

//modifying users
app.patch('/users/:selector', verifyJWT, body('email').optional().isEmail().withMessage("Invalid Email Format"), async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation error');
        res.status(500).json({ errors: errors.array() });
    } else if (req.user?.role === "admin" || req.user?.role === "moderator") {
        const selector = decodeURIComponent(req.params.selector);
        try {
            const updatedUser = await User.findOneAndUpdate(
                { $or: [{ name: selector }, { email: { $regex: `^${selector}$`, $options: 'i' } }] },
                {
                    $set: { ...req.body }
                },
                { new: true }
            );

            if (updatedUser) {
                console.log('user updated');
                res.status(200).json({ message: "User data modified", user: updatedUser });
            } else {
                console.log('user not found while updating');
                res.status(404).json({ message: "User not found" });
            }
        } catch (error) {
            console.error('error while updating user ', error);
            res.status(500).json({ message: "An error occurred while updating the user" });
        }
    } else {
        console.log('access denied');
        res.status(401).json({ message: "Access denied while udating user" });
    }
});

// Deleting user
app.delete('/users/:selector', verifyJWT, async (req: Request, res: Response) => {
    if (req.user?.role !== "admin") {
        res.status(401).json({ "message": "acces denied while deleting user" });
    } else {
        const selector = decodeURIComponent(req.params.selector);
        try {
            const deletedUser = await User.findOneAndDelete(
                { $or: [{ name: selector }, { email: { $regex: `^${selector}$`, $options: 'i' } }] }
            );
            if (deletedUser) {
                console.log('user deleted');
                res.status(200).json({ message: "User Deleted" });
            } else {
                console.log('user not found while deleting');
                res.status(404).json({ message: "User not found" });
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            res.status(500).json({ message: "An error occurred while deleting the user" });
        }
    }
})

//CRUD Cards

// adding cards
app.post('/library', creatingCardValidationSchema(), async (req: Request, res: Response) => {
    if (req.user?.role !== "admin") {
        res.status(401).json({ "message": "acces denied while adding card" });
    } else {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation error');
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
            });
            try {
                const savedCard = await newCard.save();
                if (savedCard) {
                    console.log("card added to library");
                    res.status(201).json({ message: `new card added to library card:${newCard}` });
                } else {
                    console.log("card couldn't be added to library");
                    res.status(500).json({ message: "An error occurred while adding card to library" });
                }
            } catch (error) {
                console.error("Error while adding card to library:", error);
                res.status(500).json({ message: "An error occurred while adding card to library" });
            }
        }
    }
});
// geting card from database using attack, toughness, rarity or name
app.get('/library/:selector', async (req: Request, res: Response) => {
    const selector = req.params.selector;


    const numericSelector = parseInt(selector);

    try {
        const query: any = {
            $or: []
        };

        if (!isNaN(numericSelector)) {
            query.$or.push(
                { attack: numericSelector },
                { toughness: numericSelector }
            );
        };

        query.$or.push(
            { name: { $regex: new RegExp(selector, 'i') } },
            { rarity: { $regex: new RegExp(selector, 'i') } }
        );

        const foundedCards = await Card.find(query);

        if (foundedCards.length !== 0) {
            console.log('card founded');
            res.status(200).json(foundedCards);
        } else {
            console.log('card not found');
            res.status(404).json({ message: "Card not found" });
        }
    } catch (error) {
        console.error('error while searching card', error);
        res.status(500).json({ message: "An error occurred while searching for the card" });
    }
});

//modifying cards
app.patch('/library/:name', verifyJWT, updatingCardValidationSchema(), async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation error');
        res.status(400).json({ errors: errors.array() });
    } else if (req.user?.role === "admin" || req.user?.role === "moderator") {
        const cardName = decodeURIComponent(req.params.name);
        try {
            const updatedCard = await Card.findOneAndUpdate(
                { name: cardName },
                { $set: { ...req.body } },
                { new: true }
            );

            if (updatedCard) {
                console.log("card updated");
                res.status(200).json({ message: "Card data modified", card: updatedCard });
            } else {
                console.log("card to update not found");
                res.status(404).json({ message: "Card not found" });
            }
        } catch (error) {
            console.error('error while updating card', error);
            res.status(500).json({ message: "An error occurred while updating the Card" });
        }
    } else {
        res.status(401).json({ "message": "acces denied while modifying card" })
    }
})

// deleting cards
app.delete('/library/:name', async (req: Request, res: Response) => {
    if (req.user?.role !== "admin") {
        res.status(401).json({ "message": "acces denied while deleting card" })
    } else {
        const cardName = decodeURIComponent(req.params.name);
        try {
            const deletedCard = await Card.findOneAndDelete({ name: cardName })
            if (deletedCard) {
                console.log("card Deleted");
                res.status(200).json({ message: "Card Deleted" });
            } else {
                console.log("card to delete not found");
                res.status(404).json({ message: "Card not found" });
            }
        } catch (error) {
            console.error("error while deleting card:", error);
            res.status(500).json({ message: "An error occurred while deleting the card" });
        }
    }
})
//CRUD decks
//adding new deck
app.post(
    '/decks',
    verifyJWT,
    body('deckname')
        .notEmpty().withMessage("deckname must be provided")
        .isString().withMessage("deckname must be a string"),
    async (req: Request, res: Response) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            console.log('Validation error');
            res.status(400).json({ errors: errors.array() });
        } else {
            try {
                const newDeck = new Deck({
                    deckName: req.body.deckname,
                    owner: req.user?.name,
                    cardList: []
                })
                const saveDeck = await newDeck.save()
                if (saveDeck) {
                    console.log(`added new deck for user: ${req.user?.name}`);
                    res.status(201).json({
                        message: `New deck created: ${newDeck.deckName}, for user: ${req.user?.name}`
                    });
                } else {
                    console.log('deck could not be saved');
                    res.status(500).json({ message: "An error occurred while creating deck" });
                }
            } catch (error) {
                console.error("error while creating deck:", error);
                res.status(500).json({ message: "An error occurred while creating deck" });
            }
        }
    }
);

//searching one deck of a user by name
app.get('users/:selector/decks/:deckname', async (req: Request, res: Response) => {
    const userSelector = decodeURIComponent(req.params.selector);
    const deckName = decodeURIComponent(req.params.deckname);
    try {
        const findUser = await User.findOne({
            $or: [{ name: userSelector }, { email: { $regex: `^${userSelector}$`, $options: 'i' } }]
        });

        if (findUser) {
            const findDeck = await Deck.findOne({ deckName: deckName, owner: findUser.name });

            if (findDeck) {
                console.log('deck found');
                res.status(200).json(findDeck.cardList);
            } else {
                console.log('deck could not be found');
                res.status(404).json({ message: "Deck not found" });
            }
        } else {
            console.log('user not found');
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("error while searching deck:", error);
        res.status(500).json({ message: "An error occurred while searching deck" });
    }
});

//Searching all decks of user
app.get('/users/:selector/decks', async (req: Request, res: Response) => {
    const userSelector = decodeURIComponent(req.params.selector);
    try {
        const findUser = await User.findOne({
            $or: [{ name: userSelector }, { email: { $regex: `^${userSelector}$`, $options: 'i' } }],
        });

        if (findUser) {
            const findDeck = await Deck.find({ owner: findUser.name });

            if (findDeck.length > 0) {
                console.log("decks found");
                res.status(200).json(findDeck);
            } else {
                console.log('decks not found');
                res.status(404).json({ message: "Decks not found" });
            }
        } else {
            console.log('user not found');
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("error while searching decks:", error);
        res.status(500).json({ message: "An error occurred while searching decks" });
    }
});
//modyfing cardlist inside a deck

// adding card into a deck
app.patch('decks/:deckname/add-cards',
    verifyJWT,
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
            console.log('Validation error');
            res.status(400).json({ errors: errors.array() });
        } else {
            try {
                const findDeck = await Deck.findOne({ deckName: req.params.deckname, owner: req.user?.name });

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
                    console.log('cards added');
                    res.status(200).json({ message: "Cards added successfully", cardList: findDeck.cardList });
                } else {
                    console.log('deck not found');
                    res.status(404).json({ message: "Deck not found" });
                }
            } catch (error) {
                console.error("error while adding cards:", error);
                res.status(500).json({ message: "An error occurred while adding cards" });
            }
        }
    }
);

// delete cards from deck
app.patch('decks/:deckname/remove-cards',
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
            console.log('Validation error');
            res.status(400).json({ errors: errors.array() });
        } else {
            const userSelector = decodeURIComponent(req.params.selector);
            try {

                const findDeck = await Deck.findOne({ deckName: req.params.deckname, owner: req.user?.name });

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
                    console.log('card removed');
                    res.status(200).json({ message: "Cards removed successfully", cardList: findDeck.cardList });
                } else {
                    console.log('deck not found');
                    res.status(404).json({ message: "Deck not found" });
                }
            } catch (error) {
                console.error("error while removing cards:", error);
                res.status(500).json({ message: "An error occurred while removing cards" });
            }
        }
    }
);

//Delete deck
app.delete('decks/:deckname', async (req: Request, res: Response) => {
    const deckName = decodeURIComponent(req.params.deckname);
    try {

        const findDeck = await Deck.findOneAndDelete({ deckName: deckName, owner: req.user?.name });

        if (findDeck) {
            console.log('deck deleted');
            res.status(204).json({ "message": "deck deleted" });
        } else {
            console.log('deck not found');
            res.status(404).json({ message: "Deck not found" });
        }
    } catch (error) {
        console.error("error while searching deck:", error);
        res.status(500).json({ message: "An error occurred while searching deck" });
    }
});
//user login
app.post('/users/login', async (req: Request, res: Response) => {
    const { name, password } = req.body;

    try {
        const user = await User.findOne({ name });
        if (!user) {
            console.log('user not found');
            res.status(404).json({ message: "User not found" });
        } else {
            const isPasswordValid = await verifyPassword(password, user.password)
            if (!isPasswordValid) {
                console.log('invalid password');
                res.status(401).json({ message: "Invalid password" });
            } else {
                const token = jwt.sign(
                    { id: user._id, role: user.role, name: user.name },
                    process.env.JWT_SECRET!,
                    { expiresIn: process.env.JWT_EXPIRATION || '1h' }
                );
                console.log(`login successful, ${user.name}`);
                res.status(200).json({ token });
            }
        }
    } catch (error) {
        console.error("error during login:", error);
        res.status(500).json({ message: "An error occurred during login" });
    }
});
//start application
https.createServer(credentials, app).listen(port, () => {
    console.log(`Server running at https://localhost:${port}`);
});