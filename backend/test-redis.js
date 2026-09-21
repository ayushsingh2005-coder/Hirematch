// backend/test-redis.js
require("dotenv").config();
import {redis}  from"./src/config/redis.js";

(async () => {
  await redis.set("test:key", "hello", { ex: 30 });
  console.log(await redis.get("test:key")); // "hello"
  console.log(await redis.ttl("test:key")); // ~30
})();