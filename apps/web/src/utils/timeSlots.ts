const pad = (n: number) => String(n).padStart(2, '0');
// 15-minute start times from 10:00 to 23:45.
const SLOTS = Array.from({ length: 56 }, (_, i) => `${pad(10 + Math.floor(i / 4))}:${pad((i % 4) * 15)}`);
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const slotLabel = (time: string) =>
  new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/** The slots on a local date that are still after `now`. */
export const slotsOn = (date: string, now: Date) => SLOTS.filter((time) => new Date(`${date}T${time}`) > now);

/** Today in the browser's zone, or tomorrow once today has no slots left. */
export function firstOpenDate(now: Date) {
  const today = localDate(now);
  return slotsOn(today, now).length ? today : localDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
}

/** The picked slot while it's still offered, else the first at or after 6:00 PM, else the first. */
export const chosenSlot = (slots: string[], picked: string | undefined) =>
  picked && slots.includes(picked) ? picked : (slots.find((t) => t >= '18:00') ?? slots[0]);

/** Local date and time as an ISO UTC instant; '' when there's no time, so the server reports it on the field. */
export const toIsoUtc = (date: string, time: string | undefined) => (time ? new Date(`${date}T${time}`).toISOString() : '');
