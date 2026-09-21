import dotenv from "dotenv";

dotenv.config();

const config = {
    MONGODB_URI : process.env.MONGODB_URI
}

export default config;