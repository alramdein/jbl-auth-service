import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import userRepository from "../repositories/userRepository.js";
import logger from "../utils/logger.js";
import { mapError } from "../utils/errors.js";
import { format } from "path";

const sendVerificationEmail = async (user, token) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Email Verification",
        text: `Please verify your email by clicking the following link: ${verificationUrl}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
            return error;
        } else {
            console.log("Email sent:", info.response);
        }
    });
};

const registerUser = async (userData) => {
    try {
        const existingUser = await userRepository.findUserByEmail(
            userData.email
        );
        if (existingUser) {
            throw new Error("User already exists");
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        userData.password = hashedPassword;

        const verificationToken = crypto.randomBytes(32).toString("hex");
        userData.verificationToken = verificationToken;
        userData.isVerified = false;

        const user = await userRepository.createUser(userData);
        await sendVerificationEmail(user, verificationToken);

        return {
            id: user.id,
            email: user.email,
            isVerified: user.isVerified,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const loginUser = async (userData, fastify) => {
    const user = await userRepository.findUserByEmail(userData.email);
    if (!user || !(await bcrypt.compare(userData.password, user.password))) {
        throw new Error("Invalid email or password");
    }

    const token = fastify.jwt.sign({ id: user._id, email: user.email });
    return { token };
};

const verifyEmail = async (token) => {
    try {
        if (token == "" || token == null || token == undefined) {
            throw new Error("Token required");
        }

        const user = await userRepository.findUserByToken(token);
        if (!user) {
            throw new Error("Invalid or expired token");
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const forgotPassword = async (email) => {
    try {
        const user = await userRepository.findUserByEmail(email);
        if (!user) {
            throw new Error("No account with that email address exists");
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: "Password Reset",
            text: `Please reset your password by clicking the following link: ${resetUrl}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                logger.error("Error sending email forgot password:", error);
                return error;
            } else {
                logger.log("Email sent:", info.response);
            }
        });
    } catch (error) {
        logger.error(error);
        throw error
    }
};

const resetPassword = async (token, password) => {
    try {
        const user = await userRepository.findUserByResetToken(token);
        if (!user || user.resetPasswordExpires < Date.now()) {
            throw new Error("Invalid or expired token");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const validateToken = async (requestHeader, fastify) => {
    try {
        if (requestHeader === undefined || requestHeader === null) {
            throw Error("Authorization header missing");
        }

        const authHeader = requestHeader["authorization"];
        if (!authHeader) {
            throw Error("Authorization header missing");
        }

        if (!authHeader.startsWith("Bearer ")) {
            throw new Error("Invalid token");
        }

        const token = authHeader.split(" ")[1];
        const decoded = await fastify.jwt.verify(token);
        return { user: decoded };
    } catch (error) {
        logger.error(error);
        throw mapError(error);
    }
};

export default {
    sendVerificationEmail,
    registerUser,
    loginUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
    validateToken,
};
