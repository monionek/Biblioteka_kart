import { body } from 'express-validator';
import User from "../schemes/Users";

export const createEmailChain = () => body('email').isEmail().withMessage("invalid email").custom(async value => {
    const user = await User.findOne({ email: value })
    if (user) {
        throw new Error('E-mail already in use');
    }
});

export const createNameChain = () => body('name').notEmpty().withMessage("Name must be required").isString().withMessage("Must be String only");

export const createPasswordChain = () => body('password').notEmpty().withMessage("password must be provided").isLength({ min: 8 }).withMessage("password must have at least 8 symbols").isString().withMessage("password must be a string")

