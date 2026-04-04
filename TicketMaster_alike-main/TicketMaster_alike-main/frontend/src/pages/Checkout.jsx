import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const tickets = location.state?.tickets || [];
  const eventTitle = location.state?.eventTitle || "";
  const eventLocation = location.state?.eventLocation || "";
  const eventDate = location.state?.eventDate || "";

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReserve = async () => {
    if (!user) {
      setMessage("Please log in first.");
      return;
    }

    if (user.role !== "user") {
      setMessage("Only ticket buyers can reserve tickets.");
      return;
    }

    if (tickets.length === 0) {
      setMessage("No available tickets.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await api.post(`/tickets/${tickets[0].id}/reserve`, {
        user_id: user.id,
      });

      setMessage(res.data.message || "Booking confirmed.");

      setTimeout(() => {
        navigate("/my-tickets");
      }, 1000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Failed to reserve ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!location.state) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <h1 className="page-title">Checkout</h1>
          <p style={{ textAlign: "center" }}>No booking details found.</p>
          <p style={{ textAlign: "center" }}>
            <Link to="/">Return to Events</Link>
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="page-container">
        <h1 className="page-title">Checkout</h1>
        <p style={{ textAlign: "center" }}>
          Review your booking before confirming.
        </p>

        {!user && (
          <p style={{ textAlign: "center" }}>
            You must be logged in to reserve a ticket.
          </p>
        )}

        {user && user.role === "creator" && (
          <p style={{ textAlign: "center" }}>
            Event creators cannot reserve tickets.
          </p>
        )}

        {tickets.length === 0 ? (
          <p style={{ textAlign: "center" }}>No available tickets.</p>
        ) : (
          <div className="event-card">
            <h2>{eventTitle}</h2>
            <p><strong>Date:</strong> {eventDate}</p>
            <p><strong>Location:</strong> {eventLocation}</p>
            <p><strong>Ticket Type:</strong> General Admission</p>
            <p><strong>Quantity:</strong> 1</p>
            <p><strong>Tickets Remaining:</strong> {tickets.length}</p>

            <button
              onClick={handleReserve}
              disabled={isSubmitting || !user || user.role !== "user"}
            >
              {isSubmitting ? "Confirming..." : "Confirm Booking"}
            </button>
          </div>
        )}

        {message && <p style={{ textAlign: "center" }}>{message}</p>}
      </div>
    </>
  );
}