import { expect } from 'chai';
import sinon from 'sinon';
import dotenv from "dotenv";
import authService from "../services/authService.js";
import userRepository from '../repositories/userRepository.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

dotenv.config();

describe('AuthService', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('registerUser', () => {
        it('should throw an error if user already exists', async () => {
            sandbox.stub(userRepository, 'findUserByEmail').resolves(true);

            try {
                await authService.registerUser({ email: 'test@example.com', password: 'password123' });
            } catch (error) {
                expect(error.message).to.equal('User already exists');
            }
        });

        it('should create a new user and send verification email', async () => {
            const userData = { email: 'test@example.com', password: 'password123' };
            sandbox.stub(userRepository, 'findUserByEmail').resolves(false);
            sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');
            sandbox.stub(crypto, 'randomBytes').returns({ toString: () => 'verificationToken' });
            sandbox.stub(userRepository, 'createUser').resolves({ id: '1', email: 'test@example.com', isVerified: false });
            sandbox.stub(authService, 'sendVerificationEmail').resolves();

            const result = await authService.registerUser(userData);

            expect(result).to.deep.equal({ id: '1', email: 'test@example.com', isVerified: false });
        });
    });

    describe('loginUser', () => {
        it('should throw an error if email or password is invalid', async () => {
            sandbox.stub(userRepository, 'findUserByEmail').resolves(null);

            try {
                await authService.loginUser({ email: 'test@example.com', password: 'password123' }, { jwt: { sign: () => {} } });
            } catch (error) {
                expect(error.message).to.equal('Invalid email or password');
            }
        });

        it('should return a token if login is successful', async () => {
            const user = { _id: '1', email: 'test@example.com', password: 'hashedPassword' };
            const fastify = { jwt: { sign: () => 'token' } };
            sandbox.stub(userRepository, 'findUserByEmail').resolves(user);
            sandbox.stub(bcrypt, 'compare').resolves(true);

            const result = await authService.loginUser({ email: 'test@example.com', password: 'password123' }, fastify);

            expect(result).to.deep.equal({ token: 'token' });
        });
    });

    describe('verifyEmail', () => {
        it('should throw an error if token is empty', async () => {
            try {
                await authService.verifyEmail('');
            } catch (error) {
                expect(error.message).to.equal('Token required');
            }
        });

        it('should throw an error if user is not found by token', async () => {
            sandbox.stub(userRepository, 'findUserByToken').resolves(null);

            try {
                await authService.verifyEmail('invalidToken');
            } catch (error) {
                expect(error.message).to.equal('Invalid or expired token');
            }
        });

        it('should verify email and update user', async () => {
            const user = {
                save: sinon.stub().resolves(),
            };
            sandbox.stub(userRepository, 'findUserByToken').resolves(user);

            await authService.verifyEmail('validToken');

            expect(user.isVerified).to.be.true;
            expect(user.verificationToken).to.be.undefined;
            expect(user.save).to.have.been.calledOnce;
        });
    });

    describe('forgotPassword', () => {
        it('should throw an error if no account with email exists', async () => {
            sandbox.stub(userRepository, 'findUserByEmail').resolves(null);

            try {
                await authService.forgotPassword('nonexistent@example.com');
            } catch (error) {
                expect(error.message).to.equal('No account with that email address exists');
            }
        });

        it('should generate reset token and save user', async () => {
            const user = {
                save: sinon.stub().resolves(),
            };
            sandbox.stub(userRepository, 'findUserByEmail').resolves(user);
            sandbox.stub(crypto, 'randomBytes').returns({ toString: () => 'resetToken' });

            await authService.forgotPassword('existing@example.com');

            expect(user.resetPasswordToken).to.equal('resetToken');
            expect(user.resetPasswordExpires).to.be.above(Date.now());
            expect(user.save).to.have.been.calledOnce;
        });
    });

    describe('resetPassword', () => {
        it('should throw an error if token is invalid or expired', async () => {
            sandbox.stub(userRepository, 'findUserByResetToken').resolves(null);

            try {
                await authService.resetPassword('invalidToken');
            } catch (error) {
                expect(error.message).to.equal('Invalid or expired token');
            }
        });

        it('should reset password if token is valid', async () => {
            const user = {
                save: sinon.stub().resolves(),
            };
            sandbox.stub(userRepository, 'findUserByResetToken').resolves(user);
            sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');

            await authService.resetPassword('validToken');

            expect(user.password).to.equal('hashedPassword');
            expect(user.resetPasswordToken).to.be.undefined;
            expect(user.resetPasswordExpires).to.be.undefined;
            expect(user.save).to.have.been.calledOnce;
        });
    });

    describe('validateToken', () => {
        it('should throw an error if authorization header is missing', async () => {
            try {
                await authService.validateToken(undefined, {});
            } catch (error) {
                expect(error.message).to.equal('Authorization header missing');
            }
        });

        it('should throw an error if token is invalid', async () => {
            const requestHeader = { authorization: 'InvalidToken' };

            try {
                await authService.validateToken(requestHeader, { jwt: { verify: sinon.stub().throws(new Error('Invalid token')) } });
            } catch (error) {
                expect(error.message).to.equal('Invalid token');
            }
        });

        it('should return decoded user if token is valid', async () => {
            const requestHeader = { authorization: 'Bearer validToken' };
            const decoded = { id: '123', email: 'test@example.com' };

            const fastify = { jwt: { verify: sinon.stub().resolves(decoded) } };

            const result = await authService.validateToken(requestHeader, fastify);

            expect(result).to.deep.equal({ user: decoded });
        });
    });
});
