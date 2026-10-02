export const IcsLink = ({ id }: { id: string }) => (
  <a href={`/api/events/${id}/invite.ics`} download className="link">
    Download calendar invite (.ics)
  </a>
);
