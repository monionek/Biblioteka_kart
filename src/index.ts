import express, { Request, Response } from 'express';
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

mongoose.connect(mongoUrl).then(() => {
    console.log("DataBase connected")
}).catch((error) => {
    console.log(error)
})

app.use(express.json());

//CRUD usera
//dodawanie nowego użytkownika
app.post('/users', async (req: Request, res: Response) => {
    const { name, email } = req.body;

    if (!name || !email || typeof name !== 'string' || typeof email !== 'string') {
        res.status(400).json({ message: `Incorrect name or email` });
    } else {
        const newUser = new User({
            id: uuidv4(),
            name: name,
            email: email
        })
        await newUser.save().then(() => console.log("user saved"));
        res.status(201).json({ message: `new user created with id: ${newUser.id}` });
    }
});
//szukanie użytkownika po id lub nazwie
app.get('/users/:query', async (req: Request, res: Response) => {
    const query = req.params.query;
    try {
        const foundUser = await User.findOne({
            $or: [{ id: query }, { name: query }]
        })
        if (foundUser) {
            res.status(200).json(foundUser)
        } else {
            res.status(404).json({ message: "user not found" })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while updating the user" });
    }
});

//modyfikowanie użytkownika
app.patch('/users/:id', async (req: Request, res: Response) => {
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
app.post('/library', async (req: Request, res: Response) => {
    const { name, rarity, color, type, cost, attack, toughness, description } = req.body;

    if (typeof name !== 'string' || typeof rarity !== 'string' || typeof color !== 'string' || typeof type !== 'string' || typeof cost !== 'object' || typeof attack !== 'string' || typeof toughness !== 'string' || typeof description !== 'string') {
        res.status(400).json({ message: `Incorrect something` })
    } else {
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
// app.get('/library/:name', (req: Request, res: Response) => {
//     const cardName = req.params.name;
//     const card = dataBaseCards.find(el => el.name === cardName); // tutaj będzie szukanie w dataBaseie karty po nazwie
//     if (card) {
//         res.status(200).json(card);
//     } else {
//         res.status(404).json({ message: "card not found" });
//     }
// });
// //modyfikowanie karty
// app.patch('/library/:name', (req: Request, res: Response) => {
//     const cardName = req.params.name;
//     const card: Card | undefined = dataBaseCards.find(el => el.name === cardName); // tutaj będzie szukanie w dataBaseie karty po nazwie później zrobić żeby można było szukać też po typie rarity i koszcie itp
//     if (card) {
//         for (let key in card) { //iterujemy o kluczach card
//             if (req.body.hasOwnProperty(key)) { // patrzyymy czy req.body posaida taki sam klucz jak card
//                 card[key as keyof Card] = req.body[key]; // jeśli tak zamieniami wartośc klucz a card na wartość klucza z req.body
//             }
//         }
//         res.status(200).json({ message: "Card data modified" });
//     } else {
//         res.status(404).json({ message: "Card not found" });
//     }
// })

// //usuwanie karty
// app.delete('/library/:name', (req: Request, res: Response) => {
//     const cardName = req.params.name;
//     const indexOfCard: number = dataBaseCards.findIndex(el => el.name === cardName);
//     if (indexOfCard > -1) {
//         // tutaj zaimplementować usuwanie z data base karty pózniej
//         dataBaseCards.splice(indexOfCard, 1);
//         res.status(200).json({ message: "Card deleted" })
//     } else {
//         res.status(404).json({ message: "Card not found" });
//     }
// })
//CRUD talii

//uruchamianie aplikacji
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
