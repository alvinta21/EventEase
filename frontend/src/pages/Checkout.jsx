import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const eventId = location.state?.eventId || null;
  const quantity = location.state?.quantity || 1;
  const eventTitle = location.state?.eventTitle || "";
  const eventLocation = location.state?.eventLocation || "";
  const eventDate = location.state?.eventDate || "";
  const ticketsRemaining = location.state?.ticketsRemaining || 0;

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmBooking = async () => {
    if (!user) {
      setMessage("Please log in first.");
      return;
    }

    if (user.role !== "user") {
      setMessage("Only ticket buyers can confirm bookings.");
      return;
    }

    if (!eventId) {
      setMessage("No event selected.");
      return;
    }

    if (!quantity || quantity < 1) {
      setMessage("Please select a valid quantity.");
      return;
    }

    if (quantity > ticketsRemaining) {
      setMessage("Selected quantity exceeds available tickets.");
      return;
    }

    const trimmedCardName = cardName.trim();
    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    const trimmedExpiry = expiry.trim();
    const trimmedCvv = cvv.trim();

    if (trimmedCardName.length < 2) {
      setMessage("Please enter a valid name on card.");
      return;
    }

    if (!/^[A-Za-z\s]+$/.test(trimmedCardName)) {
      setMessage("Name on card should only contain letters and spaces.");
      return;
    }

    if (!/^\d{16}$/.test(cleanCardNumber)) {
      setMessage("Card number must be exactly 16 digits.");
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(trimmedExpiry)) {
      setMessage("Expiry date must be in MM/YY format.");
      return;
    }

    if (!/^\d{3}$/.test(trimmedCvv)) {
      setMessage("CVV must be exactly 3 digits.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await api.post(`/events/${eventId}/confirm-booking`, {
        user_id: user.id,
        quantity,
        card_name: trimmedCardName,
        card_number: cleanCardNumber,
        expiry: trimmedExpiry,
        cvv: trimmedCvv,
      });

      setMessage(
        `${res.data.message}. ${res.data.quantity_confirmed} ticket(s) booked.`
      );

      setTimeout(() => {
        navigate("/my-tickets");
      }, 1200);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Failed to confirm booking.");
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
          Review your booking and complete checkout.
        </p>

        {!user && (
          <p style={{ textAlign: "center" }}>
            You must be logged in to book a ticket.
          </p>
        )}

        {user && user.role === "creator" && (
          <p style={{ textAlign: "center" }}>
            Event creators cannot book tickets.
          </p>
        )}

        {!eventId ? (
          <p style={{ textAlign: "center" }}>No event selected.</p>
        ) : (
          <div className="event-card">
            <h2>{eventTitle}</h2>
            <p><strong>Date:</strong> {eventDate}</p>
            <p><strong>Location:</strong> {eventLocation}</p>
            <p><strong>Ticket Type:</strong> General Admission</p>
            <p><strong>Quantity:</strong> {quantity}</p>
            <p><strong>Tickets Remaining:</strong> {ticketsRemaining}</p>

            <div style={{ marginTop: "20px" }}>
              <p><strong>Mock Payment Details</strong></p>

              <input
                type="text"
                placeholder="Name on Card"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                style={{ width: "100%", marginBottom: "10px", padding: "10px" }}
              />

              <input
                type="text"
                placeholder="Card Number"
                value={cardNumber}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "").slice(0, 16);
                  value = value.replace(/(.{4})/g, "$1 ").trim();
                  setCardNumber(value);
                }}
                style={{ width: "100%", marginBottom: "10px", padding: "10px" }}
              />

              <input
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");

                  if (value.length >= 1) {
                    let month = value.slice(0, 2);

                    if (month.length === 2) {
                      if (parseInt(month, 10) > 12) month = "12";
                      if (parseInt(month, 10) === 0) month = "01";
                    }

                    let rest = value.slice(2, 4);
                    value = month + (rest ? "/" + rest : "");
                  }

                  setExpiry(value.slice(0, 5));
                }}
                style={{ width: "100%", marginBottom: "10px", padding: "10px" }}
              />

              <input
                type="text"
                placeholder="CVV"
                value={cvv}
                onChange={(e) =>
                  setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                }
                style={{ width: "100%", marginBottom: "10px", padding: "10px" }}
              />
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={isSubmitting || !user || user.role !== "user"}
            >
              {isSubmitting ? "Processing..." : `Confirm ${quantity} Ticket(s)`}
            </button>
          </div>
        )}

        {message && (
          <p style={{ textAlign: "center", marginTop: "16px" }}>{message}</p>
        )}
      </div>
    </>
  );
}