/** Heading and reason shown in place of registration when it can't succeed. */
export const unavailable = (status: 'full' | 'closed', capacity: number) =>
  status === 'full'
    ? ['This event is full', `All ${capacity} seats are taken, so registration is closed.`]
    : ['Registration closed', 'Registration closes when the event starts, and this one has already begun.'];
