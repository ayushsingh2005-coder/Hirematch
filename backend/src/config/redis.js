import { Redis } from '@upstash/redis';
import config from './config.js';



const redis = new Redis({
  url: config.UPSTASH_REDIS_REST_URL,
  token: config.UPSTASH_REDIS_REST_TOKEN,
  automaticDeserialization: false,
});

export default redis;