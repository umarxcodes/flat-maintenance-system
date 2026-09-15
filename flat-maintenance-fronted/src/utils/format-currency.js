// =====================  CURRENCY FORMATTER UTILITY  ===========
/**
 * Formats a numeric amount into a localized currency string.
 * Defaults to PKR (Pakistani Rupee).
 *
 * @param {number|string} amount
 * @param {string} currency - ISO-4217 code (default: "PKR")
 * @returns {string}
 */
export const formatCurrency = (amount, currency = "PKR") => {
  const numeric = typeof amount === "number" ? amount : Number(amount) || 0;
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `${currency} ${numeric.toLocaleString()}`;
  }
};

export default formatCurrency;
