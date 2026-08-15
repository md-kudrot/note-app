const express = require("express")
const path = require("path")
const dotenv = require("dotenv")
const cors = require("cors")
const crypto = require("crypto")

dotenv.config({ path: path.join(__dirname, ".env") })

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb")
const uri = process.env.MONGODB_URI
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5000

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
})

// Verify session token by looking it up in the database
async function verifySessionToken(token) {
    if (!token) {
        return null
    }

    try {
        // Better-auth session tokens can be in two formats:
        // 1. Simple token (just the token value)
        // 2. Signed token (token.signature)

        let sessionToken = token

        // If token contains a dot, extract the data part (without signature)
        if (token.includes(".")) {
            const [signature, data] = token.split(".")
            sessionToken = data
        }

        // Lookup the session in database
        const db = client.db("note-app")
        const sessionsCollection = db.collection("session")
        const session = await sessionsCollection.findOne({ token: sessionToken })

        if (!session || new Date(session.expiresAt) < new Date()) {
            return null
        }

        return session.userId
    } catch (error) {
        return null
    }
}

// Middleware to verify session token
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    const token = authHeader.split(" ")[1]
    const userId = await verifySessionToken(token)

    if (!userId) {
        return res.status(401).json({ message: "Invalid token" })
    }

    req.userId = userId
    next()
}

// Wrap async route handlers so errors return 500 instead of crashing the process
const asyncHandler = (fn) => async (req, res) => {
    try {
        await fn(req, res)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: error.message || "Server error" })
    }
}

async function run() {
    try {
        await client.connect()

        const db = client.db("note-app")
        const notesCollection = db.collection("notes")

        // GET all notes for authenticated user
        app.get("/notes", authenticate, asyncHandler(async (req, res) => {
            const data = await notesCollection.find({ userId: req.userId })
            const result = await data.toArray()
            res.json(result)
        }))

        // GET single note by id (must belong to user)
        app.get("/notes/:id", authenticate, asyncHandler(async (req, res) => {
            const id = req.params.id
            const result = await notesCollection.findOne({
                _id: new ObjectId(id),
                userId: req.userId
            })
            if (!result) {
                return res.status(404).json({ message: "Note not found" })
            }
            res.json(result)
        }))

        // POST create new note with userId
        app.post("/notes", authenticate, asyncHandler(async (req, res) => {
            const noteData = {
                ...req.body,
                userId: req.userId,
                createdAt: new Date(),
                updatedAt: new Date()
            }
            const result = await notesCollection.insertOne(noteData)
            res.status(201).json({
                ...noteData,
                _id: result.insertedId
            })
        }))

        // PATCH update note (must belong to user)
        app.patch("/notes/:id", authenticate, asyncHandler(async (req, res) => {
            const id = req.params.id
            const updatedData = { ...req.body }
            // Immutable/system fields must never be written back
            delete updatedData._id
            delete updatedData.userId
            delete updatedData.createdAt
            updatedData.updatedAt = new Date()
            const result = await notesCollection.updateOne(
                { _id: new ObjectId(id), userId: req.userId },
                { $set: updatedData }
            )
            res.json(result)
        }))

        // DELETE note (must belong to user)
        app.delete("/notes/:id", authenticate, asyncHandler(async (req, res) => {
            const id = req.params.id
            const result = await notesCollection.deleteOne({
                _id: new ObjectId(id),
                userId: req.userId
            })
            res.json(result)
        }))

        await client.db("admin").command({ ping: 1 })
        console.log("Pinged your deployment. You successfully connected to MongoDB!")
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close()
    }
}

run().catch(console.dir)

app.get("/", (req, res) => {
    res.send("Note App Server is running")
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

