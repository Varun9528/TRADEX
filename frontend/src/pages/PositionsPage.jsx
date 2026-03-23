  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 md:px-4 py-3 sticky top-0 z-10 safe-area-top">
        <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Positions</h1>
        
        {/* Summary Cards - Responsive Grid */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3">
          <div>
            <div className="text-[10px] md:text-xs text-gray-500">Investment</div>
            <div className="text-sm font-semibold">₹{totalInvestment.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] md:text-xs text-gray-500">Current Value</div>
            <div className="text-sm font-semibold">₹{totalCurrentValue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] md:text-xs text-gray-500">Total P&L</div>
            <div className={`text-xs md:text-sm font-semibold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{totalPnl.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 md:gap-2 overflow-x-auto scrollbar-hide">
          {['open', 'closed', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-colors active:scale-95 ${
                filter === f
                  ? 'bg-[#00d084] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Positions List */}
      <div className="p-2 md:p-4 space-y-2 md:space-y-3">
        {positions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2 text-sm">No positions found</div>
            <button 
              onClick={() => window.location.href = '/stocks'}
              className="text-[#00d084] font-medium text-sm"
            >
              Start Trading
            </button>
          </div>
        ) : (
          positions.map((pos) => (
            <div key={pos._id} className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200">
              {/* Symbol Header */}
              <div className="flex justify-between items-start mb-2 md:mb-3">
                <div>
                  <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                    <h3 className="font-bold text-base md:text-lg">{pos.symbol}</h3>
                    <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded ${
                      pos.productType === 'MIS' ? 'bg-orange-100 text-orange-700' :
                      pos.productType === 'MTF' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {pos.productType}
                    </span>
                    {pos.leverageUsed > 1 && (
                      <span className="text-[10px] md:text-xs bg-gray-100 text-gray-600 px-1.5 md:px-2 py-0.5 rounded">
                        {pos.leverageUsed}x
                      </span>
                    )}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">Qty: {pos.quantity}</div>
                </div>
                
                <div className="text-right">
                  <div className="text-base md:text-lg font-bold">₹{pos.currentPrice?.toLocaleString()}</div>
                  <div className={`text-xs md:text-sm font-semibold ${
                    pos.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {pos.pnlPercentage}% (₹{pos.unrealizedPnl?.toLocaleString()})
                  </div>
                </div>
              </div>

              {/* Position Details - Responsive Grid */}
              <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm mb-2 md:mb-3">
                <div>
                  <span className="text-gray-500">Avg Price:</span>
                  <span className="ml-2 font-medium">₹{pos.averagePrice?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Investment:</span>
                  <span className="ml-2 font-medium">₹{pos.investmentValue?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Current Value:</span>
                  <span className="ml-2 font-medium">₹{pos.currentValue?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">P&L:</span>
                  <span className={`ml-2 font-medium ${
                    pos.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ₹{pos.totalPnl?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!pos.isClosed && pos.netQuantity > 0 && (
                <button
                  onClick={() => handleClosePosition(pos.symbol)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-2 md:py-2.5 rounded-lg font-medium text-sm transition-colors active:scale-95"
                >
                  Square Off
                </button>
              )}

              {pos.isClosed && (
                <div className="text-center text-gray-500 text-xs md:text-sm py-2">
                  Position Closed
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );