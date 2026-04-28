require("dotenv").config();

const connectDB = require("./config/db");
const app = require("./app");
const { startSimulationEngine } = require('./services/simulationEngine');

connectDB();

startSimulationEngine();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});