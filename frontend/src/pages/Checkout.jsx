import { useLocation, useNavigate, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const eventId = location.state?.eventId;
  const eventTitle = location.state?.eventTitle || "";
  const eventLocation = location.state?.eventLocation || "";
  const eventDate = location.state?.eventDate || "";
  const adultPrice = Number(location.state?.adultPrice || 0);
  const childPrice = Number(location.state?.childPrice || 0);
  const ticketsRemaining = Number(location.state?.ticketsRemaining || 0);

  const [adultQuantity, setAdultQuantity] = useState(1);
  const [childQuantity, setChildQuantity] = useState(0);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalTickets = Number(adultQuantity) + Number(childQuantity);

  const totalCost = useMemo(() => {
    return (Number(adultQuantity) * adultPrice) + (Number(childQuantity) * childPrice);
  }, [adultQuantity, childQuantity, adultPrice, childPrice]);

  const formatCardNumber = (value) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 16);
    return digitsOnly.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
    if (digitsOnly.length <= 2) return digitsOnly;
    return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
  };

  const handleAdultChange = (e) => {
    const value = Number(e.target.value);
    if (value + Number(childQuantity) <= ticketsRemaining) {
      setAdultQuantity(value);
    }
  };

  const handleChildChange = (e) => {
    const value = Number(e.target.value);
    if (Number(adultQuantity) + value <= ticketsRemaining) {
      setChildQuantity(value);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setMessage("Please log in first.");
      return;
    }

    if (user.role !== "user") {
      setMessage("Only ticket buyers can confirm bookings.");
      return;
    }

    if (!eventId) {
      setMessage("Missing event details.");
      return;
    }

    if (totalTickets < 1) {
      setMessage("Please select at least 1 ticket.");
      return;
    }

    if (totalTickets > ticketsRemaining) {
      setMessage("Selected quantity exceeds available tickets.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await api.post(`/events/${eventId}/confirm-booking`, {
        user_id: user.id,
        adult_quantity: adultQuantity,
        child_quantity: childQuantity,
        card_name: cardName,
        card_number: cardNumber,
        expiry,
        cvv,
      });

      setMessage(res.data.message || "Booking confirmed.");

      setTimeout(() => {
        navigate("/my-tickets");
      }, 1000);
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
            You must be logged in to confirm a booking.
          </p>
        )}

        {user && user.role === "creator" && (
          <p style={{ textAlign: "center" }}>
            Event creators cannot confirm bookings.
          </p>
        )}

        <div className="event-card">
          <h2>{eventTitle}</h2>
          <p><strong>Date:</strong> {eventDate}</p>
          <p><strong>Location:</strong> {eventLocation}</p>
          <p><strong>Adult Ticket Price:</strong> £{adultPrice.toFixed(2)}</p>
          <p><strong>Child Ticket Price:</strong> £{childPrice.toFixed(2)}</p>
          <p><strong>Tickets Remaining:</strong> {ticketsRemaining}</p>

          <div style={{ marginTop: "20px", marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>
              Adult Tickets
            </label>
            <input
              type="number"
              min="0"
              max={ticketsRemaining}
              value={adultQuantity}
              onChange={handleAdultChange}
              style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
            />

            <label style={{ display: "block", marginBottom: "8px" }}>
              Child Tickets
            </label>
            <input
              type="number"
              min="0"
              max={ticketsRemaining}
              value={childQuantity}
              onChange={handleChildChange}
              style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
            />
          </div>

          <p><strong>Total Tickets:</strong> {totalTickets}</p>
          <p><strong>Total Cost:</strong> £{totalCost.toFixed(2)}</p>

          <div style={{ marginTop: "24px" }}>
            <input
              type="text"
              placeholder="Name on Card"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
            />

            <input
              type="text"
              placeholder="Card Number"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
            />

            <input
              type="text"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
            />

            <input
              type="text"
              placeholder="CVV"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
              style={{ width: "100%", padding: "12px", marginBottom: "16px" }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !user || user.role !== "user"}
          >
            {isSubmitting ? "Confirming..." : `Confirm ${totalTickets} Ticket(s)`}
          </button>
        </div>

        {message && <p style={{ textAlign: "center" }}>{message}</p>}
      </div>
    </>
  );
}