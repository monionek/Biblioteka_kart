import express, { Request, Response } from 'express';
import { validationResult, body } from 'express-validator';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt, { MyJwtPayload } from 'jsonwebtoken';
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
import cors from 'cors';
import WebSocket, { WebSocketServer } from 'ws';
import cookieParser from 'cookie-parser';
import mqtt from 'mqtt'

const corsOptions = {
    origin: ['https://172.20.44.64:3000', 'https://localhost:3000'],  // frontend URL
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

const app = express();
dotenv.config();
const port = process.env.PORT || 8443;
const mongoUrl = process.env.MONGO_URL
const privateKey = fs.readFileSync('src/ssl/key.pem', 'utf8');
const certificate = fs.readFileSync('src/ssl/cert.pem', 'utf8')
const server = https.createServer({ key: privateKey, cert: certificate }, app);
const wss = new WebSocketServer({ server });
let messageCount = 0;
mongoose.connect(mongoUrl).then(() => {
    console.log("DataBase connected");
}).catch((error) => {
    console.log(error);
})

app.use(express.json(), cors(corsOptions), cookieParser());

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
            res.status(400).json({ message: `Error while creating new user` });
        }
    }
}
);
//searching user by name or email
app.get('/users/:selector', async (req: Request, res: Response) => {
    const selector = req.params.selector;
    try {
        const foundUser = await User.findOne({
            $or: [{ name: selector }, { email: { $regex: `^${selector}$`, $options: 'i' } }]
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
        res.status(400).json({ message: "An error occurred while searching user" });
    }
});

//modifying users
app.patch('/users/:selector', verifyJWT, body('email').optional().isEmail().withMessage("Invalid Email Format"), async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation error');
        res.status(400).json({ errors: errors.array() });
    } else if (req.user?.role === "admin" || req.user?.role === "moderator") {
        const selector = decodeURIComponent(req.params.selector);
        try {
            const updatedUser = await User.findOneAndUpdate(
                { $or: [{ name: selector }, { email: { $regex: `^${selector}$`, $options: 'i' } }, { role: selector }] },
                {
                    $set: { ...req.body }
                },
                { new: true }
            );

            if (updatedUser) {
                const findDecks = await Deck.updateMany({ owner: selector }, { $set: { owner: req.body.name } })
                console.log('user updated');
                res.status(200).json({ message: "User data modified", user: updatedUser });
            } else {
                console.log('user not found while updating');
                res.status(404).json({ message: "User not found" });
            }
        } catch (error) {
            console.error('error while updating user ', error);
            res.status(400).json({ message: "An error occurred while updating the user" });
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
            res.status(400).json({ message: "An error occurred while deleting the user" });
        }
    }
})

//CRUD Cards

// adding cards
app.post('/library', verifyJWT, creatingCardValidationSchema(), async (req: Request, res: Response) => {
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
                    res.status(400).json({ message: "An error occurred while adding card to library" });
                }
            } catch (error) {
                console.error("Error while adding card to library:", error);
                res.status(400).json({ message: "An error occurred while adding card to library" });
            }
        }
    }
});
// getting card from database by name or rarity
app.get(
    '/library/:selector',
    async (req: Request, res: Response) => {
        const selector = req.params.selector; // Get selector from URL (e.g., 'name' or 'rarity')
        const value = req.query.value as string; // Get the search value from query string (e.g., '?value=Ajani')

        if (!['name', 'rarity'].includes(selector)) {
            res.status(400).json({ message: "Invalid selector. Use 'name' or 'rarity'." });
        } else {

            if (!value || typeof value !== 'string') {
                res.status(400).json({ message: "Search value must be provided as a query parameter." });
            } else {
                try {
                    const query: any = {
                        [selector]: { $regex: new RegExp(value, 'i') } // Dynamically construct query
                    };

                    const foundedCards = await Card.find(query);

                    if (foundedCards.length !== 0) {
                        console.log('Card(s) found');
                        res.status(200).json(foundedCards);
                    } else {
                        console.log('Card not found');
                        res.status(404).json({ message: "Card not found" });
                    }
                } catch (error) {
                    console.error('Error while searching card:', error);
                    res.status(400).json({ message: "An error occurred while searching for the card" });
                }
            }
        }
    }
);

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
            res.status(400).json({ message: "An error occurred while updating the Card" });
        }
    } else {
        res.status(401).json({ "message": "acces denied while modifying card" })
    }
})

// deleting cards
app.delete('/library/:name', verifyJWT, async (req: Request, res: Response) => {
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
            res.status(400).json({ message: "An error occurred while deleting the card" });
        }
    }
})
//CRUD decks
//adding new deck
app.post(
    '/decks',
    verifyJWT,
    body('deckName')
        .notEmpty().withMessage("deckName must be provided")
        .isString().withMessage("deckName must be a string"),
    async (req: Request, res: Response) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            console.log('Validation error');
            res.status(400).json({ errors: errors.array() });
        } else {
            try {
                const findDeck = await Deck.findOne({ deckName: req.body.deckName, owner: req.user?.name })
                if (findDeck) {
                    console.log('deck could not be saved');
                    res.status(400).json({ message: "There is already deck with this name for this user" });
                } else {
                    const newDeck = new Deck({
                        deckName: req.body.deckName,
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
                        res.status(400).json({ message: "An error occurred while creating deck" });
                    }
                }
            } catch (error) {
                console.error("error while creating deck:", error);
                res.status(400).json({ message: "An error occurred while creating deck" });
            }
        }
    }
);

//searching all deck with provided name
app.get('/decks/:deckname', body('deckName'), async (req: Request, res: Response) => {
    const selector = decodeURIComponent(req.params.deckname);
    try {
        const findDecks = await Deck.find({ deckName: selector });

        if (findDecks.length !== 0) {
            console.log('decks found');
            res.status(200).json(findDecks);
        } else {
            console.log('decks could not be found');
            res.status(404).json({ message: "Decks not found" });
        }
    } catch (error) {
        console.error("error while searching deck:", error);
        res.status(400).json({ message: "An error occurred while searching deck" });
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
        res.status(400).json({ message: "An error occurred while searching decks" });
    }
});
//modyfing cardlist inside a deck

// adding card into a deck
app.patch('/deck/add-cards',
    verifyJWT,
    body('cardList')
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
                const findDeck = await Deck.findOne({ deckName: req.body.deckName, owner: req.user?.name });

                if (findDeck) {
                    const addPromises = req.body.cardList.map(async (element: string) => {
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
                res.status(400).json({ message: "An error occurred while adding cards" });
            }
        }
    }
);

// delete cards from deck
app.patch('/deck/remove-cards',
    verifyJWT,
    body('cardList')
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

                const findDeck = await Deck.findOne({ deckName: req.body.deckName, owner: req.user?.name });
                if (findDeck) {
                    for (const element of req.body.cardList) {
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
                res.status(400).json({ message: "An error occurred while removing cards" });
            }
        }
    }
);

//Delete deck
app.delete('/decks/:deckname', verifyJWT, async (req: Request, res: Response) => {
    const deckName = decodeURIComponent(req.params.deckname);
    try {

        const findDeck = await Deck.findOneAndDelete({ deckName: deckName, owner: req.user?.name });

        if (findDeck) {
            if (req.user?.role === "admin" || findDeck.owner === req.user?.name) {
                console.log('deck deleted');
                res.status(204).json({ "message": "deck deleted" });
            } else {
                console.log('invalid permissions')
                res.status(401).json({ "message": "invalid persmissions" })
            }
        } else {
            console.log('deck not found');
            res.status(404).json({ message: "Deck not found" });
        }
    } catch (error) {
        console.error("error while searching deck:", error);
        res.status(400).json({ message: "An error occurred while searching deck" });
    }
});
//user login
app.post('/login', async (req: Request, res: Response) => {
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
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    maxAge: 3600000,
                    domain: 'localhost',
                });
                res.status(200).json({ token });
            }
        }
    } catch (error) {
        console.error("error during login:", error);
        res.status(400).json({ message: "An error occurred during login" });
    }
});
app.get('/check-auth', verifyJWT, (req, res) => {
    res.status(200).json({ message: 'Jesteś zalogowany' });
});
app.post('/logout', verifyJWT, (req, res) => {
    console.log("logout")
    res.status(200).json({ message: 'Jesteś wylogowany' });
});
wss.on('connection', (ws, req: Request) => {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const token = urlParams.get('token');
    const user = {
        name: "Guest",
        role: "guest"
    };
    if (token !== null) {
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET) as MyJwtPayload;
        } catch (err) {
            ws.send("Invalid token!");
            ws.close();
            return;
        }
        user.name = decoded.name
        user.role = decoded.role
    }


    ws.send(`Hello ${user.name}! Your role ${user.role}.`);

    ws.on('message', (message) => {
        console.log(`message acquired: ${message}`);
        messageCount++;

        const formattedMessage = `${user.name} (${user.role}): ${message}`;
        mqttClient.publish('chat/numberOfMessages', String(messageCount));
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(formattedMessage);
            }
        });
    });

    ws.on('close', () => {
        console.log(`${user.name} disconnectd.`);
    });
});
const mqttClient = mqtt.connect(process.env.MQTT_URL_BACKEND, {
    username: process.env.MQTT_LOGIN,
    password: process.env.MQTT_PASSWORD,
});
mqttClient.on('message', (topic, message) => {
    if (topic === 'chat/numberOfMessages') {
        const messageCount = parseInt(message.toString());
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(`There are currently ${messageCount} messages in the chat.`);
            }
        });
    }
});
// start app
server.listen(port, () => {
    console.log(`Server running at https://localhost:${port}`);
});