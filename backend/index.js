const express = require('express');
const bcrypt = require('bcrypt');
const {PrismaClient} = require('@prisma/client');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();

app.use(express.json())

// signup
app.post("/signup", async (req, res) => {
    const {email, password} = req.body;

    // check if user exists or not through email
    const user = await prisma.users.findUnique({
        where: {email}
    })

    // if user exists, send error response
    if (user) {
        return res.status(422).json({error: "User already exists"})
    }

    // else
    // first, hash the password using bycrypt
    try {
        const hash = bcrypt.hashSync(password, 10)

        // then, create user in database
        await prisma.users.create({
            data: {
                email,
                password: hash
            }
        })
        return res.status(200).json({message: "User created successfully"})

    }
    catch (error) {
        return res.status(500).json({error: "Error hashing password"})
    }
})

// login
app.post("/login", async (req, res) => {
    const {email, password} = req.body;

    // check if email or password is missing
    if (!email || !password) {
        return res.status(400).json({error: "Email or password are missing"})
    }

    // find user by email
    const user = await prisma.users.findUnique({
        where: {email}
    })

    // if user not found, send error message
    if (!user) {
        return res.status(404).json({error:"User not found"})
    }

    // take hashedpassword from db and user input password
    // user compareSync(password, hashedpassword)
    const isPasswordMatch = bcrypt.compareSync(password, user.password);
    if (!isPasswordMatch) {
        return res.status(400).json({error: "Invalid crdentials"})
    }
    const token = jwt.sign({email: user.email}, process.env.SECRET_KEY)
    return res.status(200).json({
        message: "Login successful",
        token: token,
        user: {
            email: user.email
        },
    })
})

// Authorization
async function isValidToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    try {
        const isVerifiedToken = await jwt.verify(token, process.env.SECRET_KEY)
        if (isVerifiedToken) {
            next()
        }
        else {
            return res.status(401).json({message: "You are not authorized"})
        }
    }
    catch (error) {
        return res.status(401).json({message: "You are not authorized"})
    }
}

app.get("/protected", isValidToken, async (req, res) => {
    const users = await prisma.users.findMany();
    return res.status(200).json({data: users})
})

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000')
})