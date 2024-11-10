import dotenv from 'dotenv';
dotenv.config();

const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT,
};

export default config;
