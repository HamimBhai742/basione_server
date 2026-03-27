
import { redis as redisConnect } from "./redisOptions";
// Redis Configuration
redisConnect.on("connect", () => console.log("✅ Redis connected successfully"));
redisConnect.on("error", (err: any) => console.error("❌ Redis error:", err));


export default redisConnect;