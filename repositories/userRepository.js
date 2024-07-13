import User from '../models/userModel.js';

const createUser = async (userData) => {
    const user = new User(userData);
    await user.save();
    return user;
};

const findUserByEmail = async (email) => {
    return await User.findOne({ email });
};

const findUserByToken = async (token) => {
    return await User.findOne({ verificationToken: token });
};

const findUserByResetToken = async (token) => {
    return await User.findOne({ resetPasswordToken: token });
};

export default {
    createUser,
    findUserByEmail,
    findUserByToken,
    findUserByResetToken
};
