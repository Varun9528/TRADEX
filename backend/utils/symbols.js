/**
 * Utility functions for symbol normalization and consistency
 * Ensures all stock symbols are stored in a consistent format across the system
 */

/**
 * Normalize a stock symbol to NSE format (.NS suffix)
 * - Converts to uppercase
 * - Ensures .NS suffix for NSE stocks
 * - Converts .BO to .NS
 * - Removes -EQ suffix
 * - Trims whitespace
 * 
 * @param {string} symbol - The stock symbol to normalize
 * @returns {string} Normalized symbol with .NS (e.g., "RELIANCE" → "RELIANCE.NS", "HDFCBANK.BO" → "HDFCBANK.NS")
 */
function normalizeSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') {
    return '';
  }
  
  let clean = symbol.toUpperCase().trim();
  
  // Remove -EQ suffix first
  clean = clean.replace('-EQ', '');
  
  // Convert .BO to .NS, or add .NS if no suffix
  if (!clean.endsWith('.NS')) {
    clean = clean.replace('.BO', '') + '.NS';
  }
  
  return clean;
}

/**
 * Check if a symbol needs normalization
 * @param {string} symbol - The stock symbol to check
 * @returns {boolean} True if symbol needs normalization
 */
function needsNormalization(symbol) {
  if (!symbol || typeof symbol !== 'string') {
    return false;
  }
  
  return symbol.includes('.NS') || 
         symbol.includes('.BO') || 
         symbol !== symbol.toUpperCase() || 
         symbol.trim() !== symbol;
}

/**
 * Normalize an array of symbols
 * @param {Array<string>} symbols - Array of stock symbols
 * @returns {Array<string>} Array of normalized symbols
 */
function normalizeSymbols(symbols) {
  if (!Array.isArray(symbols)) {
    return [];
  }
  
  return symbols.map(normalizeSymbol).filter(s => s.length > 0);
}

module.exports = {
  normalizeSymbol,
  needsNormalization,
  normalizeSymbols,
};
