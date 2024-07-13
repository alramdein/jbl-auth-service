import { expect } from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import authService from '../services/authService.js';
import userRepository from '../repositories/userRepository.js';
import logger from '../utils/logger.js';

describe('Auth Service', () => {
    let bcryptHashStub;
    let cryptoRandomBytesStub;
    let sendMailStub;
    let findUserByEmailStub;
    let createUserStub;
    let findUserByTokenStub;
    let findUserByResetTokenStub;

    before(() => {
        bcryptHashStub = sinon.stub(bcrypt, 'hash').resolves('hashedPassword');
        cryptoRandomBytesStub = sinon.stub(crypto, 'randomBytes').returns({ toString: () => 'verificationToken' });
        sendMailStub = sinon.stub(nodemailer.createTransport().prototype, 'sendMail').yields(null, 'Email sent');
        findUserByEmailStub = sinon.stub(userRepository, 'findUserByEmail');
        createUserStub = sinon.stub(userRepository, 'createUser');
        findUserByTokenStub = sinon.stub(userRepository, 'findUserByToken');
        findUserByResetTokenStub = sinon.stub(userRepository, 'findUserByResetToken');
    });

    after(() => {
        bcryptHashStub.restore();
        cryptoRandomBytesStub.restore();
        sendMailStub.restore();
        findUserByEmailStub.restore();
        createUserStub.restore();
        findUserByTokenStub.restore();
        findUserByResetTokenStub.restore();
    });

    it('should register a new user and send a verification email', async () => {
        findUserByEmailStub.withArgs('test@example.com').resolves(null);
        createUserStub.resolves({ _id: 'userId', email: 'test@example.com' });

        const userData = {
            email: 'test@example.com',
            password: 'password123'
        };

        const result = await authService.registerUser(userData);

        expect(result).to.have.property('_id');
        expect(sendMailStub.calledOnce).to.be.true;
        expect(sendMailStub.calledWith(sinon.match({ to: 'test@example.com' }))).to.be.true;
    });

    it('should not register a user with an existing email', async () => {
        findUserByEmailStub.withArgs('existing@example.com').resolves({ _id: '123' });

        const userData = {
            email: 'existing@example.com',
            password: 'password123'
        };

        try {
            await authService.registerUser(userData);
        } catch (error) {
            expect(error.message).to.equal('User already exists');
        }

        expect(sendMailStub.called).to.be.false;
    });

    it('should login a user with correct credentials', async () => {
        findUserByEmailStub.withArgs('test@example.com').resolves({
            _id: 'userId',
            email: 'test@example.com',
            password: 'hashedPassword',
            isVerified: true
        });

        const compareStub = sinon.stub(bcrypt, 'compare').resolves(true);
        const fastify = { jwt: { sign: sinon.stub().returns('jwtToken') } };

        const result = await authService.loginUser({ email: 'test@example.com', password: 'password123' }, fastify);

        expect(result).to.have.property('token', 'jwtToken');

        compareStub.restore();
    });

    it('should not login a user with incorrect credentials', async () => {
        findUserByEmailStub.withArgs('test@example.com').resolves(null);

        try {
            await authService.loginUser({ email: 'test@example.com', password: 'password123' }, {});
        } catch (error) {
            expect(error.message).to.equal('Invalid email or password');
        }
    });

    it('should not login a user if email is not verified', async () => {
        findUserByEmailStub.withArgs('test@example.com').resolves({
            _id: 'userId',
            email: 'test@example.com',
            password: 'hashedPassword',
            isVerified: false
        });

        try {
            await authService.loginUser({ email: 'test@example.com', password: 'password123' }, {});
        } catch (error) {
            expect(error.message).to.equal('Email not verified');
        }
    });

    it('should verify email with valid token', async () => {
        findUserByTokenStub.withArgs('verificationToken').resolves({
            _id: 'userId',
            save: sinon.stub().resolves()
        });

        const req = { query: { token: 'verificationToken' } };
        const reply = { code: sinon.stub().returnsThis(), send: sinon.stub() };

        await authService.verifyEmail(req, reply);

        expect(reply.code.calledWith(200)).to.be.true;
        expect(reply.send.calledWith({ message: 'Email verified successfully' })).to.be.true;
    });

    it('should handle invalid verification token', async () => {
        findUserByTokenStub.withArgs('invalidToken').resolves(null);

        const req = { query: { token: 'invalidToken' } };
        const reply = { code: sinon.stub().returnsThis(), send: sinon.stub() };

        try {
            await authService.verifyEmail(req, reply);
        } catch (error) {
            expect(error.message).to.equal('Invalid or expired token');
        }
    });

    it('should handle forgot password and send reset email', async () => {
        findUserByEmailStub.withArgs('test@example.com').resolves({
            _id: 'userId',
            email: 'test@example.com',
            save: sinon.stub().resolves()
        });

        const req = { body: { email: 'test@example.com' } };
        const reply = { code: sinon.stub().returnsThis(), send: sinon.stub() };

        await authService.forgotPassword(req, reply);

        expect(sendMailStub.calledOnce).to.be.true;
        expect(sendMailStub.calledWith(sinon.match({ to: 'test@example.com' }))).to.be.true;
    });

    it('should handle reset password with valid token', async () => {
        findUserByResetTokenStub.withArgs('resetToken').resolves({
            _id: 'userId',
            save: sinon.stub().resolves()
        });

        const req = { query: { token: 'resetToken' }, body: { password: 'newPassword' } };
        const reply = { code: sinon.stub().returnsThis(), send: sinon.stub() };

        await authService.resetPassword(req, reply);

        expect(reply.code.calledWith(200)).to.be.true;
        expect(reply.send.calledWith({ message: 'Password reset successfully' })).to.be.true;
    });

    it('should handle invalid reset token', async () => {
        findUserByResetTokenStub.withArgs('invalidToken').resolves(null);

        const req = { query: { token: 'invalidToken' }, body: { password: 'newPassword' } };
        const reply = { code: sinon.stub().returnsThis(), send: sinon.stub() };

        try {
            await authService.resetPassword(req, reply);
        } catch (error) {
            expect(error.message).to.equal('Invalid or expired token');
        }
    });
});
