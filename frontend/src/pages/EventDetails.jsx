import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function EventDetails() {
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem("user"));
  const [event, setEvent] = useState(null);
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
  }, [id]);

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
          <p><strong>Adult Ticket:</strong> £{Number(event.adult_price).toFixed(2)}</p>
          <p><strong>Child Ticket:</strong> £{Number(event.child_price).toFixed(2)}</p>
          <p>
            <strong>{event.sold_out ? "Status:" : "Tickets Remaining:"}</strong>{" "}
            {event.sold_out ? "Sold Out" : event.tickets_remaining}
          </p>

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

          {user?.role === "user" && !event.sold_out && (
            <Link
              className="event-link"
              to="/checkout"
              state={{
                eventId: event.id,
                eventTitle: event.title,
                eventLocation: event.location,
                eventDate: event.date,
                adultPrice: event.adult_price,
                childPrice: event.child_price,
                ticketsRemaining: event.tickets_remaining,
              }}
            >
              Go to Checkout
            </Link>
          )}

          {user?.role === "user" && event.sold_out && (
            <p style={{ marginTop: "12px" }}>
              This event is currently sold out.
            </p>
          )}
        </div>
      </div>
    </>
  );
}