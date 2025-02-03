import got from "got";
import WebSocket from "ws";
import { SMA, EMA, RSI, MACD } from "@debut/indicators";

class BinanceKlineWS {
  constructor(symbol = "BTCUSDT", interval = "1h") {
    this.symbol = symbol.toLowerCase();
    this.interval = interval;
    this.klines = new Map(); // Store klines with timestamp as key

    // Initialize indicators
    this.sma = new SMA(200);
    this.ema = new EMA(21);
    this.rsi = new RSI(14);
    this.macd = new MACD(12, 26, 9);

    this.initialize();
  }

  async initialize() {
    try {
      // Fetch historical klines from Binance
      const response = await got(
        `https://api.binance.com/api/v3/klines?symbol=${this.symbol.toUpperCase()}&interval=${
          this.interval
        }&limit=1000`
      ).json();

      // Store the historical klines in the Map
      response.forEach((kline, i) => {
        const formattedData = {
          time: Math.round(kline[0] / 1000),
          open: Number(kline[1]),
          high: Number(kline[2]),
          low: Number(kline[3]),
          close: Number(kline[4]),
          volume: Number(kline[5]),
          sma:
            i === response.length - 1
              ? this.sma.momentValue(Number(kline[4]))
              : this.sma.nextValue(Number(kline[4])),
          ema:
            i === response.length - 1
              ? this.ema.momentValue(Number(kline[4]))
              : this.ema.nextValue(Number(kline[4])),
          rsi:
            i === response.length - 1
              ? this.rsi.momentValue(Number(kline[4]))
              : this.rsi.nextValue(Number(kline[4])),
          macd:
            i === response.length - 1
              ? this.macd.momentValue(Number(kline[4]))
              : this.macd.nextValue(Number(kline[4])),
        };
        this.klines.set(formattedData.time, formattedData);
      });

      console.log("Successfully fetched historical klines");
      // Connect to WebSocket after fetching historical data
      this.connect();
    } catch (error) {
      console.error("Error fetching historical klines:", error);
    }
  }

  connect() {
    // Create WebSocket connection to Binance for 1min BTCUSDT klines
    this.ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${this.symbol}@kline_${this.interval}`
    );

    this.ws.on("open", () => {
      console.log(
        `Connected to Binance WebSocket for ${this.symbol} ${this.interval} klines`
      );
    });

    this.ws.on("message", (data) => {
      const parsedData = JSON.parse(data);
      if (parsedData.e !== "kline") return;
      const kline = parsedData.k;
      const isFinal = kline.x;
      const formattedData = {
        time: Math.round(kline.t / 1000),
        open: Number(kline.o),
        high: Number(kline.h),
        low: Number(kline.l),
        close: Number(kline.c),
        volume: Number(kline.v),
        sma: isFinal
          ? this.sma.nextValue(Number(kline.c))
          : this.sma.momentValue(Number(kline.c)),
        ema: isFinal
          ? this.ema.nextValue(Number(kline.c))
          : this.ema.momentValue(Number(kline.c)),
        rsi: isFinal
          ? this.rsi.nextValue(Number(kline.c))
          : this.rsi.momentValue(Number(kline.c)),
        macd: isFinal
          ? this.macd.nextValue(Number(kline.c))
          : this.macd.momentValue(Number(kline.c)),
      };
      // Update the Map with the new kline data
      this.klines.set(formattedData.time, formattedData);
      // Emit event with kline data
      this.onKline(formattedData);
    });

    this.ws.on("close", () => {
      console.log("Binance WebSocket closed, reconnecting...");
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      this.ws.close();
    });
  }

  // Placeholder for the event handler
  onKline(kline) {
    // This will be overridden when the instance is created
  }

  // Method to get the latest klines
  getKlines() {
    return Array.from(this.klines.values());
  }
}

export default BinanceKlineWS;
