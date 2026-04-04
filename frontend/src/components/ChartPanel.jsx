import { useEffect, useRef, useState } from "react"
import { createChart, CandlestickSeries, LineSeries, AreaSeries, BarSeries } from "lightweight-charts"

// Timeframe to milliseconds mapping
const TIMEFRAME_MS = {
  '1m': 60 * 1000,
  '3m': 3 * 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
}

// Generate historical tick data (simulated)
function generateHistoricalTicks(basePrice, count = 100) {
  const ticks = []
  const now = Date.now()
  let price = basePrice * 0.98
  
  for (let i = count; i > 0; i--) {
    const volatility = basePrice * 0.001
    const change = (Math.random() - 0.5) * volatility * 2
    price += change
    
    ticks.push({
      time: now - (i * 3000), // 3 second intervals
      price: parseFloat(price.toFixed(2))
    })
  }
  
  return ticks
}

// Simple candle generator - stable and predictable
function generateCandles(basePrice, count) {
  const candles = []
  let price = basePrice
  const now = Math.floor(Date.now() / 1000)
  
  for (let i = 0; i < count; i++) {
    const open = price
    const change = (Math.random() - 0.5) * 10
    const close = open + change
    const high = Math.max(open, close) + Math.random() * 5
    const low = Math.min(open, close) - Math.random() * 5
    
    candles.push({
      time: now - (count - i) * 60,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2))
    })
    
    price = close
  }
  
  return candles
}

// Aggregate ticks into candles based on timeframe
function aggregateCandles(ticks, timeframe) {
  if (ticks.length === 0) return []
  
  const intervalMs = TIMEFRAME_MS[timeframe] || TIMEFRAME_MS['1m']
  const candles = []
  
  // Group ticks by timeframe interval
  const currentCandle = {
    time: Math.floor(ticks[0].time / 1000),
    open: ticks[0].price,
    high: ticks[0].price,
    low: ticks[0].price,
    close: ticks[0].price,
  }
  
  let candleStartTime = Math.floor(ticks[0].time / intervalMs) * intervalMs
  
  for (let i = 1; i < ticks.length; i++) {
    const tick = ticks[i]
    const tickTime = Math.floor(tick.time / intervalMs) * intervalMs
    
    if (tickTime === candleStartTime) {
      // Same candle period - update OHLC
      currentCandle.high = Math.max(currentCandle.high, tick.price)
      currentCandle.low = Math.min(currentCandle.low, tick.price)
      currentCandle.close = tick.price
    } else {
      // New candle period - push current and start new
      candles.push({ ...currentCandle })
      
      currentCandle.time = Math.floor(tick.time / 1000)
      currentCandle.open = tick.price
      currentCandle.high = tick.price
      currentCandle.low = tick.price
      currentCandle.close = tick.price
      candleStartTime = tickTime
    }
  }
  
  // Push the last candle
  candles.push({ ...currentCandle })
  
  return candles
}

export default function ChartPanel({ symbol, currentPrice }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const intervalRef = useRef(null)
  const [timeframe, setTimeframe] = useState('1m')
  const [chartType, setChartType] = useState('candlestick')
  const [error, setError] = useState(null)
  
  // Defensive check - prevent crashes if no symbol
  if (!symbol) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-bg-primary">
        <div className="text-center text-text-secondary">
          <div className="text-4xl mb-3">📈</div>
          <p className="text-sm">Select an instrument to view chart</p>
        </div>
      </div>
    )
  }
  
  // Store tick data persistently
  const tickDataRef = useRef([])
  const basePriceRef = useRef(null)
  
  // Simple candle count by timeframe
  const candleCountMap = {
    '1m': 80,
    '3m': 60,
    '5m': 50,
    '15m': 40,
    '30m': 30,
    '1h': 25,
    '1d': 20
  }
  
  // Available timeframes and chart types
  const timeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '1d']
  const chartTypes = ['candlestick', 'bar', 'line', 'area']

  // Initialize chart ONCE on mount
  useEffect(() => {
    const container = chartContainerRef.current
    if (!container) {
      console.error('[ChartPanel] Container ref is null')
      return
    }

    // Set explicit dimensions - use parent container height
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.position = 'relative'

    console.log('[ChartPanel] Initializing chart for:', symbol)

    try {
      // Clean up existing chart
      if (chartRef.current) {
        console.log('[ChartPanel] Removing old chart')
        chartRef.current.remove()
        chartRef.current = null
        candleSeriesRef.current = null
        volumeSeriesRef.current = null
      }

      // Clear container
      container.innerHTML = ''

      // Create chart with advanced TradingView config
      const chart = createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        layout: {
          background: { color: "#0b1220" },
          textColor: "#cbd5e1",
          fontSize: 12,
        },
        grid: {
          vertLines: { 
            color: "#1e293b",
            style: 0, // Solid
          },
          horzLines: { 
            color: "#1e293b",
            style: 0, // Solid
          },
        },
        crosshair: {
          mode: 1, // Normal mode
          vertLine: {
            width: 1,
            color: '#4a5568',
            style: 2, // Dashed
            labelBackgroundColor: '#1a202c',
          },
          horzLine: {
            width: 1,
            color: '#4a5568',
            style: 2, // Dashed
            labelBackgroundColor: '#1a202c',
          },
        },
        rightPriceScale: {
          borderColor: "#334155",
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          autoScale: true,
          alignLabels: true,
        },
        timeScale: {
          borderColor: "#334155",
          timeVisible: true,
          secondsVisible: false,
          barSpacing: 6,
          minBarSpacing: 3,
          fixLeftEdge: false,
          fixRightEdge: false,
          handleScroll: true,
          handleScale: true,
          rightOffset: 12,
        },
        handleScroll: true,
        handleScale: true,
      })

      chartRef.current = chart

      // Add candlestick series with advanced settings
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      })

      candleSeriesRef.current = candleSeries
            
      // Initialize base price and generate candles
      basePriceRef.current = currentPrice || 2450
      
      // Generate initial candles based on timeframe
      const count = candleCountMap[timeframe] || 60
      const candles = generateCandles(basePriceRef.current, count)
      console.log(`[ChartPanel] Generated ${candles.length} candles for ${timeframe}`)
      
      // Set candle data
      candleSeries.setData(candles)
      console.log('[ChartPanel] Chart data set, candles:', candles.length)
            
      // Fit content
      chart.timeScale().fitContent()

      // Update chart every 3 seconds - only update last candle
      intervalRef.current = setInterval(() => {
        if (!candleSeriesRef.current || !basePriceRef.current) return
        
        // Simulate price movement
        const volatility = basePriceRef.current * 0.001
        const change = (Math.random() - 0.5) * volatility * 2
        const newPrice = parseFloat((basePriceRef.current + change).toFixed(2))
        basePriceRef.current = newPrice
        
        // Create updated last candle
        const now = Math.floor(Date.now() / 1000)
        const lastCandle = {
          time: now,
          open: basePriceRef.current - change,
          high: Math.max(basePriceRef.current, basePriceRef.current - change),
          low: Math.min(basePriceRef.current, basePriceRef.current - change),
          close: newPrice,
        }
        
        // Only update the last candle (efficient!)
        candleSeriesRef.current.update(lastCandle)
      }, 3000)

      console.log('[ChartPanel] Chart initialized successfully')

      // ResizeObserver - automatically tracks container size changes
      const resizeObserver = new ResizeObserver(entries => {
        if (!chartRef.current || !container) return
        
        const { width, height } = container.getBoundingClientRect()
        
        // Only update if dimensions actually changed
        if (width > 0 && height > 0) {
          console.log('[ChartPanel] ResizeObserver:', Math.round(width), 'x', Math.round(height))
          chartRef.current.applyOptions({
            width: width,
            height: height,
          })
          
          // Fit content after resize
          requestAnimationFrame(() => {
            if (chartRef.current) {
              chartRef.current.timeScale().fitContent()
            }
          })
        }
      })

      // Start observing container
      resizeObserver.observe(container)

      // Cleanup
      return () => {
        console.log('[ChartPanel] Cleaning up chart')
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        resizeObserver.disconnect()
        if (chartRef.current) {
          chartRef.current.remove()
          chartRef.current = null
          candleSeriesRef.current = null
        }
      }

    } catch (err) {
      console.error('[ChartPanel] Error creating chart:', err)
      setError(err.message)
    }
  }, []) // Run once on mount

  // Handle timeframe change - rebuild candles with new count
  useEffect(() => {
    if (!candleSeriesRef.current || !basePriceRef.current) return
    
    console.log('[ChartPanel] Timeframe changed to:', timeframe)
    
    // Generate new candles based on timeframe count
    const count = candleCountMap[timeframe] || 60
    const candles = generateCandles(basePriceRef.current, count)
    candleSeriesRef.current.setData(candles)
    
    console.log(`[ChartPanel] Rebuilt ${candles.length} candles for ${timeframe}`)
  }, [timeframe])
  
  // Handle chart type change - simplified
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return
    
    console.log('[ChartPanel] Chart type changed to:', chartType)
    
    // Remove old series
    chartRef.current.removeSeries(candleSeriesRef.current)
    
    // Create new series based on type
    let newSeries
    const commonOptions = {
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    }
    
    switch (chartType) {
      case 'line':
        newSeries = chartRef.current.addSeries(LineSeries, {
          ...commonOptions,
          color: '#22c55e',
          lineWidth: 2,
        })
        break
      case 'area':
        newSeries = chartRef.current.addSeries(AreaSeries, {
          ...commonOptions,
          lineColor: '#22c55e',
          topColor: 'rgba(34, 197, 94, 0.3)',
          bottomColor: 'rgba(34, 197, 94, 0.0)',
          lineWidth: 2,
        })
        break
      case 'bar':
        newSeries = chartRef.current.addSeries(BarSeries, {
          ...commonOptions,
          upColor: '#22c55e',
          downColor: '#ef4444',
        })
        break
      default: // candlestick
        newSeries = chartRef.current.addSeries(CandlestickSeries, {
          ...commonOptions,
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        })
    }
    
    // Get current candles and apply to new series
    const count = candleCountMap[timeframe] || 60
    const candles = generateCandles(basePriceRef.current, count)
    newSeries.setData(candles)
    candleSeriesRef.current = newSeries
    
    console.log('[ChartPanel] Series type changed to:', chartType)
  }, [chartType])
  
  // Update chart data when symbol changes - reset everything
  useEffect(() => {
    if (!candleSeriesRef.current || !chartRef.current) return
    
    console.log('[ChartPanel] Symbol changed to:', symbol)
    
    // Reset base price for new symbol
    basePriceRef.current = currentPrice || 2450
    
    // Generate fresh candles for new symbol
    const count = candleCountMap[timeframe] || 60
    const candles = generateCandles(basePriceRef.current, count)
    candleSeriesRef.current.setData(candles)
    chartRef.current.timeScale().fitContent()
    
    console.log(`[ChartPanel] New symbol ${symbol}: ${candles.length} candles`)
  }, [symbol, currentPrice])

  // Show error fallback if chart failed
  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#0b1220] text-text-secondary text-xs">
        <div className="text-center">
          <p>Chart loading...</p>
          <p className="mt-2 text-[10px] opacity-60">{symbol}</p>
        </div>
      </div>
    )
  }

  // Render chart container with toolbar
  return (
    <div className="flex flex-col h-full w-full" style={{ minWidth: 0, minHeight: 0, pointerEvents: 'auto' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-bg-secondary border-b border-border flex-shrink-0" style={{ zIndex: 5, pointerEvents: 'auto' }}>
        {/* Timeframe selector */}
        <select 
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-bg-tertiary border border-border rounded px-2 py-1 text-xs text-text-primary outline-none focus:border-brand-blue"
        >
          {timeframes.map(tf => (
            <option key={tf} value={tf}>{tf.toUpperCase()}</option>
          ))}
        </select>

        {/* Chart type selector */}
        <select 
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className="bg-bg-tertiary border border-border rounded px-2 py-1 text-xs text-text-primary outline-none focus:border-brand-blue"
        >
          {chartTypes.map(ct => (
            <option key={ct} value={ct}>{ct.toUpperCase()}</option>
          ))}
        </select>

        <div className="h-4 w-px bg-border mx-1"></div>

        {/* Symbol info */}
        <span className="text-xs font-semibold text-text-primary">{symbol}</span>
        
        {currentPrice && (
          <span className="text-xs text-text-secondary">₹{currentPrice.toFixed(2)}</span>
        )}
      </div>

      {/* Chart container */}
      <div
        ref={chartContainerRef}
        style={{
          width: '100%',
          height: '100%',
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          position: 'relative',
          backgroundColor: '#0b1220',
          zIndex: 1,
          pointerEvents: 'auto',
        }}
      />
    </div>
  )
}
