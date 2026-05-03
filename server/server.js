require("dotenv").config();

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initWebSocket } = require('./services/priceBroadcaster');
const { startSimulationEngine } = require('./services/simulationEngine');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

connectDB().then(async () => {
  await initWebSocket(server);
  startSimulationEngine();
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
});