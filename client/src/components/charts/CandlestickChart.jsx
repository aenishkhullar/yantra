import { useEffect, useRef } from 'react';

const CandlestickChart = ({ data, symbol, loading }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  // Initialize chart
  useEffect(() => {
    // Dynamically import to avoid SSR issues and version conflicts
    import('lightweight-charts').then((module) => {
      if (!containerRef.current) return;

      // Destroy existing chart if any
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }

      const { createChart, CrosshairMode } = module;

      // Ensure container has dimensions
      const width = containerRef.current.clientWidth || 700;
      const height = 380;

      const chart = createChart(containerRef.current, {
        width,
        height,
        layout: {
          background: { type: 'solid', color: '#030303' },
          textColor: '#a1a4a5',
        },
        grid: {
          vertLines: { color: 'rgba(214, 235, 253, 0.04)' },
          horzLines: { color: 'rgba(214, 235, 253, 0.04)' },
        },
        crosshair: {
          mode: CrosshairMode ? CrosshairMode.Normal : 1,
        },
        rightPriceScale: {
          borderColor: 'rgba(214, 235, 253, 0.15)',
        },
        timeScale: {
          borderColor: 'rgba(214, 235, 253, 0.15)',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: true,
        handleScale: true,
      });

      // Try v4 API first, fall back to v3
      let series;
      try {
        if (chart.addCandlestickSeries) {
          series = chart.addCandlestickSeries({
            upColor: '#11ff99',
            downColor: '#ff2047',
            borderUpColor: '#11ff99',
            borderDownColor: '#ff2047',
            wickUpColor: '#11ff99',
            wickDownColor: '#ff2047',
          });
        } else {
          // v4 uses addSeries with SeriesType
          const { CandlestickSeries } = module;
          series = chart.addSeries(CandlestickSeries, {
            upColor: '#11ff99',
            downColor: '#ff2047',
            borderUpColor: '#11ff99',
            borderDownColor: '#ff2047',
            wickUpColor: '#11ff99',
            wickDownColor: '#ff2047',
          });
        }
      } catch (e) {
        console.error('[Chart] Failed to add series:', e.message);
        return;
      }

      chartRef.current = chart;
      seriesRef.current = series;

      // Handle resize
      const ro = new ResizeObserver(() => {
        if (chartRef.current && containerRef.current) {
          chartRef.current.applyOptions({
            width: containerRef.current.clientWidth,
          });
        }
      });
      ro.observe(containerRef.current);

      // Store cleanup
      chartRef.current._ro = ro;
    }).catch((err) => {
      console.error('[Chart] Failed to load lightweight-charts:', err);
    });

    return () => {
      if (chartRef.current) {
        if (chartRef.current._ro) chartRef.current._ro.disconnect();
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []); // only run once on mount

  // Set data when it changes
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Small delay ensures chart is initialized after first render
    const timer = setTimeout(() => {
      if (!seriesRef.current) {
        console.warn('[Chart] Series not ready yet');
        return;
      }

      try {
        const formatted = data
          .map((d) => ({
            time: typeof d.date === 'string'
              ? d.date.substring(0, 10)
              : new Date(d.date).toISOString().substring(0, 10),
            open:  Number(d.open),
            high:  Number(d.high),
            low:   Number(d.low),
            close: Number(d.close),
          }))
          .filter((d) =>
            d.time &&
            !isNaN(d.open) &&
            !isNaN(d.high) &&
            !isNaN(d.low) &&
            !isNaN(d.close) &&
            d.high >= d.low
          )
          .sort((a, b) => (a.time > b.time ? 1 : -1));

        console.log(`[Chart] Setting ${formatted.length} candles`);
        seriesRef.current.setData(formatted);
        chartRef.current?.timeScale().fitContent();
      } catch (err) {
        console.error('[Chart] setData error:', err.message);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [data]);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* ref container is ALWAYS in DOM */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 380,
          background: '#030303',
          borderRadius: '0 0 12px 12px',
        }}
      />
      {/* Empty state overlays on top when no data */}
      {(!data || data.length === 0) && !loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#030303',
          borderRadius: 12,
          gap: 8,
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 28, opacity: 0.15 }}>📊</div>
          <div style={{ fontSize: 13, color: '#464a4d' }}>
            No chart data available
          </div>
          <div style={{ fontSize: 11, color: '#2a2a2a' }}>
            Try a different time period
          </div>
        </div>
      )}
    </div>
  );
};

export default CandlestickChart;
