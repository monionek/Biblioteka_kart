import express, { Request, Response } from 'express';
import bodyParser, { json } from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { cp } from 'fs';

const app = express();
const port = 3000;

interface User {
    id: string;
    name: string;
    email: string;
}

interface Card {
    name: string;
    rarity: string;
    color: string;
    type: string;
    cost: { [key: string]: number };
    attack: string;
    toughness: string;
    description: string;
}

interface Deck {
    ownerId: string;
    name: string;
    cards: Card[];
}

const dataBaseUsers: User[] = [];
const dataBaseCards: Card[] = [];
const dataBaseDecks: Deck[] = [];

app.use(express.json());

//CRUD usera
//dodawanie nowego użytkownika
app.post('/users', (req: Request, res: Response) => {
    const { name, email } = req.body;

    if (!name || !email || typeof name !== 'string' || typeof email !== 'string') {
        res.status(400).json({ message: `Incorrect name or email` })
    } else {
        const newUser = {
            id: uuidv4(),
            name: name,
            email: email
        }
        dataBaseUsers.push(newUser) // tutaj będzie potem wstawianie do data basea
        res.status(201).json({ message: `new user created with id: ${newUser.id}` })
    }
});
//szukanie użytkownika po id
app.get('/users/:id', (req: Request, res: Response) => {
    const userId = req.params.id;
    const user = dataBaseUsers.find(el => el.id === userId); // tutaj będzie szukanie w dataBaseie użytkownika po id
    if (user) {
        res.status(200).json(user);
    } else {
        res.status(404).json({ message: "user not found" });
    }
});
//modyfikowanie użytkownika
app.patch('/users/:id', (req: Request, res: Response) => {
    const userId = req.params.id;
    const user: User | undefined = dataBaseUsers.find(el => el.id === userId); // tutaj będzie szukanie w dataBaseie użytkownika po id
    if (user) {
        for (let key in user) { //iterujemy o kluczach usera
            if (req.body.hasOwnProperty(key)) { // patrzyymy czy req.body posaida taki sam klucz jak user
                user[key as keyof User] = req.body[key]; // jeśli tak zamieniami wartośc klucz a user na wartość klucza z req.body
            }
        }
        res.status(200).json({ message: "User data modified" });
    } else {
        res.status(404).json({ message: "User not found" });
    }
})
app.delete('/users/:id', (req: Request, res: Response) => {
    const userId = req.params.id;
    const indexOfUser: number = dataBaseUsers.findIndex(el => el.id === userId); // szukam indexa uzytkownika w database do usunieca
    if (indexOfUser > -1) {
        // tutaj zaimplementować usuwanie z data base użytkownika pózniej
        dataBaseUsers.splice(indexOfUser, 1);
        res.status(200).json({ message: "User deleted" })
    } else {
        res.status(404).json({ message: "User not found" });
    }
})

//CRUD kart

// dodawanie karty
app.post('/library', (req: Request, res: Response) => {
    const { name, rarity, color, type, cost, attack, toughness, description } = req.body;

    if (typeof name !== 'string' || typeof rarity !== 'string' || typeof color !== 'string' || typeof type !== 'string' || typeof cost !== 'object' || typeof attack !== 'string' || typeof toughness !== 'string' || typeof description !== 'string') {
        res.status(400).json({ message: `Incorrect something` })
    } else {
        const newCard = {
            name: name,
            rarity: rarity,
            color: color,
            type: type,
            cost: cost,
            attack: attack,
            toughness: toughness,
            description: description,
        }
        dataBaseCards.push(newCard) // tutaj będzie potem wstawianie do data basea
        res.status(201).json({ message: `new card added to library card:${newCard}` })
    }
});
// pobranie karty
app.get('/library/:name', (req: Request, res: Response) => {
    const cardName = req.params.name;
    const card = dataBaseCards.find(el => el.name === cardName); // tutaj będzie szukanie w dataBaseie karty po nazwie
    if (card) {
        res.status(200).json(card);
    } else {
        res.status(404).json({ message: "card not found" });
    }
});
//modyfikowanie karty
app.patch('/library/:name', (req: Request, res: Response) => {
    const cardName = req.params.name;
    const card: Card | undefined = dataBaseCards.find(el => el.name === cardName); // tutaj będzie szukanie w dataBaseie karty po nazwie później zrobić żeby można było szukać też po typie rarity i koszcie itp
    if (card) {
        for (let key in card) { //iterujemy o kluczach card
            if (req.body.hasOwnProperty(key)) { // patrzyymy czy req.body posaida taki sam klucz jak card
                card[key as keyof Card] = req.body[key]; // jeśli tak zamieniami wartośc klucz a card na wartość klucza z req.body
            }
        }
        res.status(200).json({ message: "Card data modified" });
    } else {
        res.status(404).json({ message: "Card not found" });
    }
})

//usuwanie karty
app.delete('/library/:name', (req: Request, res: Response) => {
    const cardName = req.params.name;
    const indexOfCard: number = dataBaseCards.findIndex(el => el.name === cardName);
    if (indexOfCard > -1) {
        // tutaj zaimplementować usuwanie z data base karty pózniej
        dataBaseUsers.splice(indexOfCard, 1);
        res.status(200).json({ message: "Card deleted" })
    } else {
        res.status(404).json({ message: "Card not found" });
    }
})
//CRUD talii

//uruchamianie aplikacji
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
