import { Link } from "react-router-dom";
import "./EventCard.css";

export default function EventCard({ event }) {
  return (
    <div className="event-card">
      <h2>{event.title}</h2>
      <p><strong>Organised by:</strong> {event.creator_name}</p>
      <p><strong>Location:</strong> {event.location}</p>
      <p><strong>Date:</strong> {event.date}</p>
      <p><strong>Available Tickets:</strong> {event.available_tickets}</p>

      <Link className="event-link" to={`/event/${event.id}`}>
        View Details
      </Link>
    </div>
  );
}