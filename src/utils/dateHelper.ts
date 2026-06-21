const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export interface MonthRange {
  start: Date;
  end: Date;
  label: string;
}

/**
 * Mengambil rentang awal-akhir bulan dari input "MM-YYYY".
 * Jika input kosong, akan memakai bulan berjalan.
 */
export function resolveMonthRange(input?: string): MonthRange {
  const now = new Date();
  let month = now.getMonth();
  let year = now.getFullYear();

  if (input) {
    const match = input.match(/^(\d{1,2})-(\d{4})$/);
    if (match) {
      month = parseInt(match[1], 10) - 1;
      year = parseInt(match[2], 10);
    }
  }

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const label = `${MONTH_NAMES_ID[month]} ${year}`;

  return {
    start,
    end,
    label,
  };
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function nextDueDateThisOrNextMonth(dayOfMonth: number): Date {
  const now = new Date();
  const candidate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);

  if (candidate.getTime() < now.getTime()) {
    candidate.setMonth(candidate.getMonth() + 1);
  }

  return candidate;
}
