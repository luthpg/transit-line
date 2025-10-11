import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function scrollToId(id: string) {
  if (typeof window !== 'undefined') {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }
}

/**
 * 時間差分、a-b
 * 日付跨ぎ考慮あり
 * リターンは分
 *
 * @param a - 引かれる元、HH:mm
 * @param b - 引く方、HH:mm
 * @return {number} - 差分の分
 */
export function getDeltaOfTime(a: string, b: string): number {
  const configs: Array<{ hour: number; min: number }> = [
    {
      hour: 0,
      min: 0,
    },
    {
      hour: 0,
      min: 0,
    },
  ];
  [a, b].forEach((v, i) => {
    const [, hour, min] = v?.match(/(\d{1,2})[:：](\d{1,2})/) ?? [
      null,
      '0',
      '0',
    ];
    configs[i].hour = parseInt(hour, 10);
    configs[i].min = parseInt(min, 10);
  });
  if (configs[0].hour < configs[1].hour) configs[0].hour += 24;
  configs[0].min += configs[0].hour * 60;
  configs[1].min += configs[1].hour * 60;
  return configs[0].min - configs[1].min;
}
