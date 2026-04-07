import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function MyTickets() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setError("Please log in to view your tickets.");
      return;
    }

    api.get(`/users/${user.id}/tickets`)
      .then((res) => {
        setBookings(res.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load tickets.");
      });
  }, [user]);

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
    <>
      <Navbar />

      <div className="page-container">
        <h1 className="page-title">My Tickets</h1>

        {error && <p>{error}</p>}

        {bookings.length === 0 ? (
          <p style={{ textAlign: "center" }}>No bookings confirmed yet.</p>
        ) : (
          bookings.map((booking) => (
            <div style={cardStyle} key={booking.booking_id}>
              <p>
                <strong>{booking.full_name.toUpperCase()}</strong>
              </p>
              <p><strong>Event:</strong> {booking.event_title}</p>
              <p><strong>Date:</strong> {booking.event_date}</p>
              <p><strong>Location:</strong> {booking.event_location}</p>
              <p><strong>Booking Reference:</strong> {booking.booking_reference}</p>
              <p><strong>Adult Tickets:</strong> {booking.adult_quantity}</p>
              <p><strong>Child Tickets:</strong> {booking.child_quantity}</p>
              <p><strong>Total Tickets:</strong> {booking.total_tickets}</p>
              <p><strong>Total Cost:</strong> £{Number(booking.total_cost).toFixed(2)}</p>
              <p><strong>Status:</strong> Booked</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}