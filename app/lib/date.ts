export type DateType = string | number | Date;

export class DateUtils {
  date: Date;
  formats: Intl.DateTimeFormatPart[];
  constructor(date?: DateType) {
    this.date = date != null ? new Date(date) : new Date();
    this.formats = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(this.date);
  }

  get year() {
    return this.formats.find((d) => d.type === 'year')?.value ?? '';
  }
  get month() {
    return this.formats.find((d) => d.type === 'month')?.value ?? '';
  }
  get day() {
    return this.formats.find((d) => d.type === 'day')?.value ?? '';
  }
  get hour() {
    return this.formats.find((d) => d.type === 'hour')?.value ?? '';
  }
  get minute() {
    return this.formats.find((d) => d.type === 'minute')?.value ?? '';
  }
  get format() {
    return `${this.year}/${this.month}/${this.day} ${this.hour}:${this.minute}:00`;
  }
  get toISOString() {
    return `${this.year}-${this.month}-${this.day}T${this.hour}:${this.minute}:00`;
  }
}
