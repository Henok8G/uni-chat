const { io } = require("socket.io-client");

/**
 * localLoadTest.js
 * 
 * Simple script simulating 'N' concurrent connections connecting and
 * enqueuing into the matching logic locally. Use this for brief load
 * assertions or debugging the watchdog functionality locally.
 * 
 * Usage:
 * node scripts/localLoadTest.js
 */

const TARGET_URL = "http://localhost:3000";
const NUM_CLIENTS = 50;

console.log(`Pumping ${NUM_CLIENTS} simulated clients into ${TARGET_URL}...`);

let connectedCount = 0;
const sockets = [];

for (let i = 0; i < NUM_CLIENTS; i++) {
  setTimeout(() => {
    const socket = io(TARGET_URL, {
      path: "/socket.io",
      transports: ["websocket"] // force WS directly to avoid polling loops on logs
    });

    socket.on("connect", () => {
      connectedCount++;
      console.log(`[+] Client ${i} connected (${connectedCount}/${NUM_CLIENTS})`);
      
      const payload = {
        userId: `load_test_${i}_${Date.now()}`,
        plan: "FREE",
        gender: i % 2 === 0 ? "MALE" : "FEMALE"
      };

      // Automatically join the queue immediately
      socket.emit("join_queue", payload);
    });

    socket.on("match_found", (data) => {
      console.log(`[MATCH] Client ${i} found a match! Room: ${data.roomId}`);
      
      // Send a random message
      socket.emit("message", {
        roomId: data.roomId,
        text: `Hello from autobot ${i}!`
      });
      
      // And then NEXT randomly after 2-10 seconds
      setTimeout(() => {
        socket.emit("next");
      }, 2000 + Math.random() * 8000);
    });

    socket.on("message", (msg) => {
      // Receive message but don't clutter the console heavily
    });

    socket.on("disconnect", () => {
      connectedCount--;
      console.log(`[-] Client ${i} disconnected`);
    });

    socket.on("connect_error", (err) => {
      console.error(`[!] Client ${i} connection error:`, err.message);
    });

    sockets.push(socket);
  }, i * 100); // 100ms stagger between connection startups
}

// Ensure processes cleans up after 60s
setTimeout(() => {
  console.log("Stopping load test simulation. Disconnecting all sockets.");
  sockets.forEach((s) => s.disconnect());
  process.exit(0);
}, 60000);
