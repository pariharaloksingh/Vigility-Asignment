const cluster = require("cluster");
const os = require("os");

const numCPUs = os.cpus().length;
console.log(`System has ${numCPUs} CPU cores\n`);

if (cluster.isPrimary) {
  console.log(`Master process ${process.pid} is running`);
  console.log(`Forking ${numCPUs} workers...\n`);

  // Create workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // If worker dies → restart
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died ❌`);
    console.log("Starting a new worker...");
    cluster.fork();
  });

} else {
  // Worker process runs server
  const startServer = require("./app");
  startServer();
}