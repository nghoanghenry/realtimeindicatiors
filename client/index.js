// Main function to initialize chart and set up Socket.IO connection
const main = () => {
  const klineChart = new KlineChart("tvchart");

  // Connect to Socket.IO server
  const socket = io("http://127.0.0.1:4000");

  // Handle initial historical klines data
  socket.on("kline", (data) => {
    if (Array.isArray(data)) {
      // Load historical data if it's an array
      klineChart.loadHistoricalData(data);
    } else {
      // Otherwise, update with real-time kline data
      klineChart.updateKline(data);
    }
  });

  socket.on("connect", () => {
    console.log("Connected to the Socket.IO server.");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from the Socket.IO server.");
  });
};

// Start the main function
main();
