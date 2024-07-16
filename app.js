import fastify from "fastify";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import logger from "./utils/logger.js";
import fastifyJwt from "@fastify/jwt";

dotenv.config();

const app = fastify({ logger });

const start = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB connected");

        // Register JWT plugin
        app.register(fastifyJwt, {
            secret: process.env.JWT_SECRET,
        });

        // Register routes
        app.register(authRoutes, { prefix: "/api" });

        app.listen({ port: process.env.PORT, host: "0.0.0.0" });
        console.log(`Server running at http://0.0.0.0:${process.env.PORT}/`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
