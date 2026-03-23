import { useEffect, useState } from "react";
import api from "../services/api";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/users/1/tickets")
      .then((res) => {
        setTickets(res.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load tickets.");
      });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Tickets</h1>

      {error && <p>{error}</p>}

      {tickets.length === 0 ? (
        <p>No tickets reserved yet.</p>
      ) : (
        tickets.map((ticket) => (
          <div
            key={ticket.id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "8px",
            }}
          >
            <p><strong>Ticket ID:</strong> {ticket.id}</p>
            <p><strong>Event ID:</strong> {ticket.event_id}</p>
            <p><strong>User ID:</strong> {ticket.user_id}</p>
            <p><strong>Status:</strong> {ticket.status}</p>
          </div>
        ))
      )}
    </div>
  );
}