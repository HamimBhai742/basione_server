
import { redis as redisConnect } from "./redisOptions";
// Redis Configuration
if (redisConnect) {
  redisConnect.on("connect", () => void 0);
  redisConnect.on("error", (err: any) => console.error("❌ Redis error:", err));
}

export default redisConnect;