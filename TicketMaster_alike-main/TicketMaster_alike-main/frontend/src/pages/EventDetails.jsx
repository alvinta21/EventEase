import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function EventDetails() {
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem("user"));
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((res) => {
        setEvent(res.data.event || null);
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

  if (error) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <p>{error}</p>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <p>Loading event...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="page-container">
        <div className="event-card">
          <h1>{event.title}</h1>
          <p><strong>Organised by:</strong> {event.creator_name}</p>
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Date:</strong> {event.date}</p>
          <p><strong>Tickets Remaining:</strong> {availableTickets.length}</p>

          {!user && (
            <p style={{ marginTop: "12px" }}>
              Please log in as a ticket buyer to reserve tickets.
            </p>
          )}

          {user?.role === "creator" && (
            <p style={{ marginTop: "12px" }}>
              Event creators cannot reserve tickets.
            </p>
          )}

          {user?.role === "user" && availableTickets.length > 0 && (
            <Link
              className="event-link"
              to="/checkout"
              state={{
                tickets: availableTickets,
                eventTitle: event.title,
                eventLocation: event.location,
                eventDate: event.date,
              }}
            >
              Go to Checkout
            </Link>
          )}

          {user?.role === "user" && availableTickets.length === 0 && (
            <p style={{ marginTop: "12px" }}>
              This event is currently sold out.
            </p>
          )}
        </div>
      </div>
    </>
  );
}