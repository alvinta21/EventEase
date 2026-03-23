import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/events")
      .then((res) => {
        const foundEvent = (res.data.events || []).find(
          (e) => String(e[0]) === String(id)
        );
        setEvent(foundEvent || null);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load event.");
      });

    api.get(`/events/${id}/tickets`)
      .then((res) => {
        setTickets(res.data || []);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [id]);

  const availableTickets = tickets.filter(
    (ticket) => ticket.status === "available"
  );

  if (error) return <p>{error}</p>;
  if (!event) return <p>Loading event...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{event[1]}</h1>
      <p><strong>Location:</strong> {event[2]}</p>
      <p><strong>Date:</strong> {event[3]}</p>
      <p><strong>Total Tickets:</strong> {event[4]}</p>
      <p><strong>Available Ticket Records:</strong> {availableTickets.length}</p>

      <Link to="/checkout" state={{ eventId: event[0], tickets: availableTickets }}>
        Go to Checkout
      </Link>
    </div>
  );
}