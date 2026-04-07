import { Link } from "react-router-dom";

export default function EventCard({ event }) {
  const cardStyle = {
    background: "#111827",
    border: "1px solid #374151",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.22)",
    maxWidth: "1100px",
    margin: "0 auto 20px auto",
    textAlign: "center",
  };

  return (
    <div style={cardStyle}>
      <h2>{event.title}</h2>
      <p><strong>Organised by:</strong> {event.creator_name}</p>
      <p><strong>Location:</strong> {event.location}</p>
      <p><strong>Date:</strong> {event.date}</p>
      <p><strong>Adult Ticket:</strong> £{Number(event.adult_price).toFixed(2)}</p>
      <p><strong>Child Ticket:</strong> £{Number(event.child_price).toFixed(2)}</p>
      <p>
        <strong>{event.sold_out ? "Status:" : "Tickets Remaining:"}</strong>{" "}
        {event.sold_out ? "Sold Out" : event.tickets_remaining}
      </p>

      <Link className="event-link" to={`/event/${event.id}`}>
        View Details
      </Link>
    </div>
  );
}