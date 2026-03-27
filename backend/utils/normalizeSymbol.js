/**
 * Normalize stock symbol to NSE format (.NS suffix)
 * 
 * Rules:
 * 1. Convert to uppercase
 * 2. Trim whitespace
 * 3. Remove any existing .NS suffix
 * 4. Always add .NS suffix
 * 
 * Examples:
 * "RELIANCE" → "RELIANCE.NS"
 * "reliance" → "RELIANCE.NS"
 * "RELIANCE.NS" → "RELIANCE.NS"
 * "HDFCBANK.BO" → "HDFCBANK.BO.NS" (then cleaned manually if needed)
 * 
 * @param {string} symbol - The stock symbol to normalize
 * @returns {string} Normalized symbol with .NS suffix
 */
function normalizeSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') {
    return symbol;
  }

  // Convert to uppercase and trim
  let clean = symbol.toUpperCase().trim();
  
  // Remove existing .NS suffix (if any)
  clean = clean.replace('.NS', '');
  
  // Always add NSE suffix
  return clean + '.NS';
}

module.exports = normalizeSymbol;
