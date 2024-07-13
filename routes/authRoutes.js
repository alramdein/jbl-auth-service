import authController from '../controllers/authController.js';

const routes = async (app) => {
    app.post('/register', authController.register);
    app.post('/login', authController.login);
    app.get('/verify-email', authController.verifyEmail);
    app.post('/forgot-password', authController.forgotPassword);
    app.post('/reset-password', authController.resetPassword);
};

export default routes;
