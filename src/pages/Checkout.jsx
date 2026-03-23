import { useLocation } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";

export default function Checkout() {
  const location = useLocation();
  const tickets = location.state?.tickets || [];
  const eventId = location.state?.eventId;
  const [message, setMessage] = useState("");

  const handleReserve = async (ticketId) => {
    try {
      const res = await api.post(`/tickets/${ticketId}/reserve`, {
        user_id: 1,
      });
      setMessage(res.data.message);
    } catch (err) {
      console.error(err);
      setMessage("Failed to reserve ticket.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Checkout</h1>
      <p>Event ID: {eventId}</p>

      {tickets.length === 0 ? (
        <p>No available tickets.</p>
      ) : (
        tickets.map((ticket) => (
          <div
            key={ticket.id}
            style={{
              border: "1px solid #ccc",
              marginBottom: "10px",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            <p><strong>Ticket ID:</strong> {ticket.id}</p>
            <p><strong>Status:</strong> {ticket.status}</p>
            <button onClick={() => handleReserve(ticket.id)}>
              Reserve Ticket
            </button>
          </div>
        ))
      )}

      {message && <p>{message}</p>}
    </div>
  );
}