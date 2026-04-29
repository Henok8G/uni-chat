import { createClient } from "redis";
import { logInfo, logError } from "../lib/logger";

/**
 * Creates and connects the pub and sub clients for the Socket.IO Redis Adapter.
 * 
 * To enable horizontal scaling of Socket.IO, provide a REDIS_URL environment
 * variable (e.g., redis://localhost:6379) in your environment stack or .env file.
 */
export async function createRedisClients() {
  const url = process.env.REDIS_URL;

  if (!url) {
    return null;
  }

  try {
    const pubClient = createClient({ url });
    const subClient = pubClient.duplicate();

    pubClient.on("error", (err) => logError("Redis", "PubClient Error", { error: String(err) }));
    subClient.on("error", (err) => logError("Redis", "SubClient Error", { error: String(err) }));

    await Promise.all([pubClient.connect(), subClient.connect()]);

    logInfo("Redis", "Connected to Redis successfully for Socket.IO adapter");
    
    return { pubClient, subClient };
  } catch (error) {
    logError("Redis", "Failed to connect to Redis", { error: String(error) });
    return null;
  }
}
