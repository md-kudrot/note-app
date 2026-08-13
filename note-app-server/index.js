const express = require("express")
const path = require("path")
const dotenv = require("dotenv")
const cors = require("cors")

dotenv.config({ path: path.join(__dirname, ".env") })

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb")
const uri = process.env.MONGODB_URI

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

async function run() {
    try {
        await client.connect()

        const db = client.db("note-app")
        const notesCollection = db.collection("notes")

        // GET all notes
        app.get("/notes", async (req, res) => {
            const data = await notesCollection.find()
            const result = await data.toArray()
            res.json(result)
        })

        // GET single note by id
        app.get("/notes/:id", async (req, res) => {
            const id = req.params.id
            const result = await notesCollection.findOne({ _id: new ObjectId(id) })
            if (!result) {
                return res.status(404).json({ message: "Note not found" })
            }
            res.json(result)
        })

        // POST create new note
        app.post("/notes", async (req, res) => {
            const noteData = req.body
            noteData.createdAt = new Date()
            noteData.updatedAt = new Date()
            const result = await notesCollection.insertOne(noteData)
            res.json(result)
        })

        // PATCH update note
        app.patch("/notes/:id", async (req, res) => {
            const id = req.params.id
            const updatedData = req.body
            updatedData.updatedAt = new Date()
            const result = await notesCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedData })
            res.json(result)
        })

        // DELETE note
        app.delete("/notes/:id", async (req, res) => {
            const id = req.params.id
            const result = await notesCollection.deleteOne({ _id: new ObjectId(id) })
            res.json(result)
        })

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

