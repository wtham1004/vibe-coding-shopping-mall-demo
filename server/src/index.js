import "dotenv/config";
import app from "./app.js";
import { connectDb } from "./config/db.js";

const startPort = Number(process.env.PORT) || 5000;
const maxPortAttempts = 10;

function listenAvailable(app, port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port);
    server.once("listening", () => resolve(server));
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        server.close(() => resolve(null));
      } else {
        reject(err);
      }
    });
  });
}


async function main() {
  await connectDb();
  let port = startPort;
  for (let i = 0; i < maxPortAttempts; i++) {
    const server = await listenAvailable(app, port);
    if (server) {
      if (port !== startPort) {
        console.warn(
          `Port ${startPort} was busy; using ${port} instead. Set PORT in .env to pick a fixed port.`,
        );
      }
      console.log(`Server listening on http://localhost:${port}`);
      return;
    }
    port++;
  }
  throw new Error(
    `Could not bind to a port in range ${startPort}–${startPort + maxPortAttempts - 1}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
