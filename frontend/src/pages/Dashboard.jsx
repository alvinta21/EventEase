import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    title: "",
    location: "",
    date: "",
    available_tickets: "",
    adult_price: "",
    child_price: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.role !== "creator") {
      navigate("/login");
      return;
    }

    loadEvents();
  }, [navigate]);

  const loadEvents = async () => {
    try {
      const res = await api.get(`/users/${user.id}/events`);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load events.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let cleanedValue = value;

    if (name === "available_tickets") {
      cleanedValue = value.replace(/\D/g, "");
    }

    if (name === "adult_price" || name === "child_price") {
      if (!/^\d*\.?\d{0,2}$/.test(value)) {
        return;
      }
      cleanedValue = value;
    }

    setFormData({
      ...formData,
      [name]: cleanedValue,
    });
  };

  const handlePriceBlur = (fieldName) => {
    const value = formData[fieldName];

    if (!value) return;

    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: parsed.toFixed(2),
      }));
    }
  };

  const handleEdit = (event) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      location: event.location,
      date: event.date,
      available_tickets: String(event.available_tickets),
      adult_price: Number(event.adult_price).toFixed(2),
      child_price: Number(event.child_price).toFixed(2),
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (eventId) => {
    setMessage("");
    setError("");

    try {
      const res = await api.delete(`/events/${eventId}`, {
        data: { creator_id: user.id },
      });

      setMessage(res.data.message || "Event deleted successfully.");

      if (editingId === eventId) {
        setEditingId(null);
        setFormData({
          title: "",
          location: "",
          date: "",
          available_tickets: "",
          adult_price: "",
          child_price: "",
        });
      }

      loadEvents();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to delete event.");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: "",
      location: "",
      date: "",
      available_tickets: "",
      adult_price: "",
      child_price: "",
    });
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (
      !formData.title ||
      !formData.location ||
      !formData.date ||
      !formData.available_tickets ||
      !formData.adult_price ||
      !formData.child_price
    ) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      let res;

      const payload = {
        title: formData.title,
        location: formData.location,
        date: formData.date,
        available_tickets: Number(formData.available_tickets),
        adult_price: Number(formData.adult_price),
        child_price: Number(formData.child_price),
        creator_id: user.id,
      };

      if (editingId) {
        res = await api.put(`/events/${editingId}`, payload);
      } else {
        res = await api.post("/events", payload);
      }

      setMessage(
        res.data.message ||
          (editingId ? "Event updated successfully." : "Event created successfully.")
      );

      setFormData({
        title: "",
        location: "",
        date: "",
        available_tickets: "",
        adult_price: "",
        child_price: "",
      });

      setEditingId(null);
      loadEvents();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to save event.");
    }
  };

  const displayName =
    user?.organisation_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    "Creator";

  const totalEvents = events.length;
  const totalTicketsRemaining = events.reduce(
    (sum, event) => sum + Number(event.tickets_remaining || 0),
    0
  );
  const totalTicketsSold = events.reduce(
    (sum, event) => sum + Number(event.sold_tickets || 0),
    0
  );
  const totalRevenue = events.reduce(
    (sum, event) => sum + Number(event.revenue_generated || 0),
    0
  );

  if (!user || user.role !== "creator") {
    return null;
  }

  return (
    <>
      <Navbar />

      <div className="page-container">
        <div className="dashboard-header">
          <h1 className="page-title">Creator Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome, {displayName}. Create and manage your events here.
          </p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-panel">
            <h2>{editingId ? "Edit Event" : "Create Event"}</h2>

            <form onSubmit={handleSubmit} className="dashboard-form">
              <input
                type="text"
                name="title"
                placeholder="Event title"
                value={formData.title}
                onChange={handleChange}
              />

              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleChange}
              />

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />

              <input
                type="number"
                name="available_tickets"
                placeholder="Number of tickets"
                value={formData.available_tickets}
                onChange={handleChange}
                min="1"
              />

              <div className="price-input-wrapper">
                <span className="price-prefix">£</span>
                <input
                  type="text"
                  name="adult_price"
                  placeholder="Adult ticket price"
                  value={formData.adult_price}
                  onChange={handleChange}
                  onBlur={() => handlePriceBlur("adult_price")}
                />
              </div>

              <div className="price-input-wrapper">
                <span className="price-prefix">£</span>
                <input
                  type="text"
                  name="child_price"
                  placeholder="Child ticket price"
                  value={formData.child_price}
                  onChange={handleChange}
                  onBlur={() => handlePriceBlur("child_price")}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="submit">
                  {editingId ? "Update Event" : "Create Event"}
                </button>

                {editingId && (
                  <button type="button" onClick={handleCancelEdit}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            {message && <p className="dashboard-success">{message}</p>}
            {error && <p className="dashboard-error">{error}</p>}
          </div>

          <div className="dashboard-panel">
            <h2>Quick Summary</h2>

            <div className="dashboard-stats">
              <div className="stat-card">
                <span className="stat-number">{totalEvents}</span>
                <span className="stat-label">Total Events</span>
              </div>

              <div className="stat-card">
                <span className="stat-number">{totalTicketsRemaining}</span>
                <span className="stat-label">Tickets Remaining</span>
              </div>

              <div className="stat-card">
                <span className="stat-number">{totalTicketsSold}</span>
                <span className="stat-label">Tickets Sold</span>
              </div>

              <div className="stat-card">
                <span className="stat-number">£{totalRevenue.toFixed(2)}</span>
                <span className="stat-label">Revenue Generated</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-events-section">
          <h2>Existing Events</h2>

          {events.length === 0 ? (
            <p className="dashboard-empty">No events created yet.</p>
          ) : (
            <div className="dashboard-events-grid">
              {events.map((event) => (
                <div className="dashboard-event-card" key={event.id}>
                  <h3>{event.title}</h3>
                  <p>
                    <strong>Location:</strong> {event.location}
                  </p>
                  <p>
                    <strong>Date:</strong> {event.date}
                  </p>
                  <p>
                    <strong>Adult Price:</strong> £{Number(event.adult_price).toFixed(2)}
                  </p>
                  <p>
                    <strong>Child Price:</strong> £{Number(event.child_price).toFixed(2)}
                  </p>
                  <p>
                    <strong>Tickets Remaining:</strong> {event.tickets_remaining}
                  </p>
                  <p>
                    <strong>Tickets Sold:</strong> {event.sold_tickets}
                  </p>
                  <p>
                    <strong>Revenue:</strong> £{Number(event.revenue_generated).toFixed(2)}
                  </p>

                  <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                    <button onClick={() => handleEdit(event)}>Edit</button>
                    <button onClick={() => handleDelete(event.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}