import dotenv from "dotenv";

dotenv.config();

if(!process.env.MONGODB_URI){
    throw new Error("MONGODB_URI is not defined  in environment variables");
}
if(!process.env.UPSTASH_REDIS_REST_URL){
    throw new Error("UPSTASH_REDIS_REST_URL is not defined  in environment variables");
}
if(!process.env.UPSTASH_REDIS_REST_TOKEN){
    throw new Error("UPSTASH_REDIS_REST_TOKEN is not defined  in environment variables");
}

const config = {
    MONGODB_URI : process.env.MONGODB_URI,
    UPSTASH_REDIS_REST_URL : process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN
}

export default config;