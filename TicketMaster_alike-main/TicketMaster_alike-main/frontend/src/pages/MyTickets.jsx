import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function MyTickets() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setError("Please log in to view your tickets.");
      return;
    }

    api.get(`/users/${user.id}/tickets`)
      .then((res) => {
        setTickets(res.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load tickets.");
      });
  }, [user]);

  return (
    <>
      <Navbar />

      <div className="page-container">
        <h1 className="page-title">My Tickets</h1>

        {error && <p>{error}</p>}

        {tickets.length === 0 ? (
          <p style={{ textAlign: "center" }}>No tickets reserved yet.</p>
        ) : (
          tickets.map((ticket) => (
            <div className="event-card" key={ticket.id}>
              <p>
                <strong>{ticket.username.toUpperCase()}</strong>
              </p>
              <p><strong>Event:</strong> {ticket.event_title}</p>
              <p><strong>Date:</strong> {ticket.event_date}</p>
              <p><strong>Location:</strong> {ticket.event_location}</p>
              <p><strong>Ticket Reference:</strong> {ticket.ticket_reference}</p>
              <p><strong>Status:</strong> {ticket.status}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}