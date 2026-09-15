import express from "express"
import cors from "cors" 
import cookirParser from "cookie-parser" // Cookies ko access karna, aur CRUD Operation perform karna
import dotenv from "dotenv"

dotenv.config({ path: "./.env" })

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
}))

//Configuration (production setup)
app.use(express.json({limit: "16kb"}))

app.use(express.urlencoded({extended: true, limit: "16kb"}))

app.use(cookirParser())

//route import 
import userRouter from './routes/UserRoutes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from './routes/comment.routes.js'
import likeRouter from './routes/like.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import healthcheckRouter from './routes/healthcheck.routes.js'

//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)

app.use((error, _req, res, _next) => {
    const statusCode = error.statusCode || 500
    return res.status(statusCode).json({
        success: false,
        message: error.message || "Internal server error",
        errors: error.errors || [],
    })
})

export { app }