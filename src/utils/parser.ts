/**
 * Mengubah teks jumlah uang dari user menjadi angka.
 * Mendukung format:
 * - "200000" -> 200000
 * - "2.000.000" / "2,000,000" -> 2000000
 * - "200k" / "200rb" -> 200000
 * - "2jt" / "2juta" -> 2000000
 */
export function parseAmount(raw: string): number | null {
  if (!raw) {
    return null;
  }

  const text = raw.trim().toLowerCase().replace(/\s+/g, "");

  const jutaMatch = text.match(/^([\d.,]+)(jt|juta)$/);
  if (jutaMatch) {
    const base = parseFloat(jutaMatch[1].replace(/\./g, "").replace(",", "."));
    return Number.isNaN(base) ? null : Math.round(base * 1_000_000);
  }

  const ribuMatch = text.match(/^([\d.,]+)(k|rb)$/);
  if (ribuMatch) {
    const base = parseFloat(ribuMatch[1].replace(/\./g, "").replace(",", "."));
    return Number.isNaN(base) ? null : Math.round(base * 1_000);
  }

  const plainMatch = text.match(/^[\d.,]+$/);
  if (plainMatch) {
    const normalized = text.replace(/[.,]/g, "");
    const value = parseInt(normalized, 10);
    return Number.isNaN(value) ? null : value;
  }

  return null;
}
