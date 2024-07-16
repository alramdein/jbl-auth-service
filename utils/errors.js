export const mapError = (error) => {
    switch (error.name) {
    case 'JsonWebTokenError':
        throw new Error('Invalid token');
    case 'TokenExpiredError':
        throw new Error('Token expired');
    default:
        throw error;
    }
};
