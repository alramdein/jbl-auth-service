import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import userRepository from '../repositories/userRepository.js';
import logger from '../utils/logger.js';

const sendVerificationEmail = async (user, token) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: 'Email Verification',
        text: `Please verify your email by clicking the following link: ${verificationUrl}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return error
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

const registerUser = async (userData) => {
    try {
        const existingUser = await userRepository.findUserByEmail(userData.email);
        if (existingUser) {
            throw new Error('User already exists');
        }
    
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        userData.password = hashedPassword;
    
        const verificationToken = crypto.randomBytes(32).toString('hex');
        userData.verificationToken = verificationToken;
        userData.isVerified = false;
    
        const user = await userRepository.createUser(userData);
        await sendVerificationEmail(user, verificationToken);
    
        return user;
    } catch (error) {
        logger.error(error);
        throw error
    }
};

const loginUser = async (userData, fastify) => {
    const user = await userRepository.findUserByEmail(userData.email);
    if (!user || !await bcrypt.compare(userData.password, user.password)) {
        throw new Error('Invalid email or password');
    }

    if (!user.isVerified) {
        throw new Error('Email not verified');
    }

    const token = fastify.jwt.sign({ id: user._id });
    return { token };
};

const verifyEmail = async (req, reply) => {
    try {
        const user = await userRepository.findUserByToken(req.query.token);
        if (!user) {
            throw new Error('Invalid or expired token');
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();
    } catch (error) {
        logger.error(error);
        throw error
    }
};

const forgotPassword = async (req, reply) => {
    try {
        const user = await userRepository.findUserByEmail(req.body.email);
        if (!user) {
            throw new Error('No account with that email address exists');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: 'Password Reset',
            text: `Please reset your password by clicking the following link: ${resetUrl}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                logger.error('Error sending email forgot password:', error);
                return error
            } else {
                logger.log('Email sent:', info.response);
            }
        });
    } catch (error) {
        reply.code(400).send({ error: error.message });
    }
};

const resetPassword = async (req, reply) => {
    try {
        const user = await userRepository.findUserByResetToken(req.query.token);
        if (!user || user.resetPasswordExpires < Date.now()) {
            throw new Error('Invalid or expired token');
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
    } catch (error) {
        fast
        return error
    }
};

export default {
    registerUser,
    loginUser,
    verifyEmail,
    forgotPassword,
    resetPassword
};



