/**
 * Maps a Dutch postcode (4-digit) to its province.
 * Approximate ranges — sufficient for subsidy lookup.
 */
export function getProvinceFromPostcode(postcode: string): string {
  const n = parseInt(postcode.slice(0, 4), 10)
  if (n >= 1000 && n <= 1999) return 'Noord-Holland'
  if (n >= 2000 && n <= 2999) return 'Zuid-Holland'
  if (n >= 3000 && n <= 3299) return 'Zuid-Holland'
  if (n >= 3300 && n <= 3999) return 'Utrecht'
  if (n >= 4000 && n <= 4499) return 'Zeeland'
  if (n >= 4500 && n <= 5799) return 'Noord-Brabant'
  if (n >= 5800 && n <= 6299) return 'Limburg'
  if (n >= 6300 && n <= 6999) return 'Gelderland'
  if (n >= 7000 && n <= 7599) return 'Gelderland'
  if (n >= 7600 && n <= 7999) return 'Overijssel'
  if (n >= 8000 && n <= 8299) return 'Friesland'
  if (n >= 8300 && n <= 8599) return 'Overijssel'
  if (n >= 8600 && n <= 8999) return 'Friesland'
  if (n >= 9000 && n <= 9299) return 'Groningen'
  if (n >= 9300 && n <= 9599) return 'Drenthe'
  if (n >= 9600 && n <= 9999) return 'Groningen'
  return 'Zuid-Holland'
}
