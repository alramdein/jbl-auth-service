import authService from "../services/authService.js";

const register = async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);
        res.code(201).send(user);
    } catch (error) {
        res.code(500).send({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const token = await authService.loginUser(req.body, req.server);
        res.code(200).send(token);
    } catch (error) {
        res.code(401).send({ error: error.message });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const message = await authService.verifyEmail(req.query.token);
        res.code(200).send({ message: "Email verified successfully" });
    } catch (error) {
        res.code(400).send({ error: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const message = await authService.forgotPassword(req.body.email);
        res.code(200).send({ message: "Password reset email sent" });
    } catch (error) {
        res.code(400).send({ error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const message = await authService.resetPassword(
            req.query.token,
            req.body.password
        );
        res.code(200).send({ message: "Password has been reset" });
    } catch (error) {
        res.code(400).send({ error: error.message });
    }
};

const validateToken = async (req, res) => {
    try {
        const ret = await authService.validateToken(req.headers, req.server);
        console.log(ret);
        res.code(200).send({
            message: "Token authenticated",
            user: ret.user,
        });
    } catch (error) {
        res.code(400).send({ error: error.message });
    }
};

export default {
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword,
    validateToken,
};
