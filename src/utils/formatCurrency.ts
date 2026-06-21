export function formatRupiah(amount: number): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  return amount < 0 ? `-${formatted}` : formatted;
}
