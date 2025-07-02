import express from "express";
import http from 'http';
import {Server} from 'socket.io';
import 'dotenv/config'

import authRoutes from "./routes/authRoutes.js"
import grpRoutes from "./routes/grpRoutes.js";
import { connectDB } from "./lib/db.js";
import { socketHandler } from "./lib/socketHandler.js"; 

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin : '*'},
});

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/grp", grpRoutes);

server.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
    connectDB();
})

socketHandler(io);  