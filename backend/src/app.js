import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express(); //create express app

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // Allow cookies to be sent
}));

app.use(express.json()); //middleware to parse JSON request bodies
app.use(cookieParser()); //middleware to parse cookies

// Import routes
import authRoutes from "./routes/auth.route.js";
import chirpsRoutes from "./routes/chirps.route.js";
import likeRoutes from "./routes/like.route.js";
import usersRoutes from "./routes/users.route.js";
import followRoutes from "./routes/follow.route.js";
import rechirpRoutes from "./routes/rechirps.route.js";

//API Routes
app.use("/auth", authRoutes);
app.use("/chirps", chirpsRoutes);
app.use("/chirps/:id/likes", likeRoutes);
app.use("/chirps/:id/rechirps", rechirpRoutes);
app.use("/users", usersRoutes);
app.use("/users/:followingId/follow", followRoutes);

export default app;