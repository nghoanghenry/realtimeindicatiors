// KlineChart class to handle the rendering of historical and real-time klines
class KlineChart {
  constructor(domElementId) {
    this.chartProperties = {
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
      pane: 0,
    };
    const domElement = document.getElementById(domElementId);
    this.chart = LightweightCharts.createChart(
      domElement,
      this.chartProperties
    );
    this.smaSeries = this.chart.addLineSeries({
      color: "orange",
      lineWidth: 5,
      pane: 0,
    });
    this.emaSeries = this.chart.addLineSeries({
      color: "dodgerblue",
      lineWidth: 5,
      pane: 0,
    });
    this.rsiSeries = this.chart.addLineSeries({
      color: "purple",
      lineWidth: 1,
      pane: 1,
    });
    this.macdFastSeries = this.chart.addLineSeries({
      color: "blue",
      lineWidth: 1,
      pane: 2,
    });
    this.macdSlowSeries = this.chart.addLineSeries({
      color: "red",
      lineWidth: 1,
      pane: 2,
    });
    this.macdHistogramSeries = this.chart.addHistogramSeries({ pane: 2 });

    // Initialize chart series
    this.candleseries = this.chart.addCandlestickSeries();
  }

  // Method to load and set historical klines data
  loadHistoricalData(klinedata) {
    // Set initial data for each series
    this.candleseries.setData(klinedata);
    this.smaSeries.setData(this.extractData(klinedata, "sma"));
    this.emaSeries.setData(this.extractData(klinedata, "ema"));
    this.rsiSeries.setData(this.extractData(klinedata, "rsi"));
    this.macdFastSeries.setData(this.extractNestedData(klinedata, "macd.macd"));
    this.macdSlowSeries.setData(
      this.extractNestedData(klinedata, "macd.signal")
    );
    this.macdHistogramSeries.setData(
      this.extractNestedData(klinedata, "macd.histogram").map((d) => ({
        color: d.value > 0 ? "mediumaquamarine" : "indianred",
        ...d,
      }))
    );

    console.log("Loaded historical data.");
  }
  // Helper method to extract data for indicators
  extractData(klinedata, key) {
    return klinedata
      .filter((d) => d[key] !== undefined)
      .map((d) => ({ time: d.time, value: d[key] }));
  }

  // Helper method to extract data for indicators
  extractNestedData(klinedata, key) {
    const [outerKey, innerKey] = key.split(".");
    return klinedata
      .filter((d) => d[outerKey] && d[outerKey][innerKey] !== undefined)
      .map((d) => ({ time: d.time, value: d[outerKey][innerKey] }));
  }
  // Update chart with real-time kline data
  updateKline(kline) {
    // Update candle series with new kline data
    this.candleseries.update(kline);
    if (kline.sma)
      this.smaSeries.update({ time: kline.time, value: kline.sma });
    if (kline.ema)
      this.emaSeries.update({ time: kline.time, value: kline.ema });
    if (kline.rsi)
      this.rsiSeries.update({ time: kline.time, value: kline.rsi });
    if (kline.macd) {
      const { macd, signal, histogram } = kline.macd;
      this.macdSlowSeries.update({ time: kline.time, value: macd });
      this.macdFastSeries.update({ time: kline.time, value: signal });
      this.macdHistogramSeries.update({
        time: kline.time,
        value: histogram,
        color: histogram > 0 ? "mediumaquamarine" : "indianred",
      });
    }
  }
}
