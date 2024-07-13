import authService from '../services/authService.js';

const register = async (req, reply) => {
    try {
        const user = await authService.registerUser(req.body);
        reply.code(201).send(user);
    } catch (error) {
        reply.code(500).send({ error: error.message });
    }
};

const login = async (req, reply) => {
    try {
        const token = await authService.loginUser(req.body, req.server);
        reply.code(200).send(token);
    } catch (error) {
        reply.code(401).send({ error: error.message });
    }
};

const verifyEmail = async (req, reply) => {
    try {
        const message = await authService.verifyEmail(req.query.token);
        reply.code(200).send({ message: 'Email verified successfully' });
    } catch (error) {
        reply.code(400).send({ error: error.message });
    }
};

const forgotPassword = async (req, reply) => {
    try {
        const message = await authService.forgotPassword(req.body.email);
        reply.code(200).send({ message: 'Password reset email sent' });
    } catch (error) {
        reply.code(400).send({ error: error.message });
    }
};

const resetPassword = async (req, reply) => {
    try {
        const message = await authService.resetPassword(req.query.token, req.body.password);
        reply.code(200).send({ message: 'Password has been reset' });
    } catch (error) {
        reply.code(400).send({ error: error.message });
    }
};


export default {
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword
};
