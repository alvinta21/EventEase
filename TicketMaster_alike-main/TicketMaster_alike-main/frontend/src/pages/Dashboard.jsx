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
  }, [user, navigate]);

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
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.name === "available_tickets"
          ? e.target.value.replace(/\D/g, "")
          : e.target.value,
    });
  };

  const handleEdit = (event) => {
    setEditingId(event[0]);
    setFormData({
      title: event[1],
      location: event[2],
      date: event[3],
      available_tickets: event[4],
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
      !formData.available_tickets
    ) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      let res;

      if (editingId) {
        res = await api.put(`/events/${editingId}`, {
          title: formData.title,
          location: formData.location,
          date: formData.date,
          available_tickets: Number(formData.available_tickets),
          creator_id: user.id,
        });
      } else {
        res = await api.post("/events", {
          title: formData.title,
          location: formData.location,
          date: formData.date,
          available_tickets: Number(formData.available_tickets),
          creator_id: user.id,
        });
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
      });

      setEditingId(null);
      loadEvents();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to save event.");
    }
  };

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
            Welcome, {user.username}. Create and manage your events here.
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
                <span className="stat-number">{events.length}</span>
                <span className="stat-label">Total Events</span>
              </div>

              <div className="stat-card">
                <span className="stat-number">
                  {events.reduce((sum, event) => sum + Number(event[4] || 0), 0)}
                </span>
                <span className="stat-label">Total Tickets</span>
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
                <div className="dashboard-event-card" key={event[0]}>
                  <h3>{event[1]}</h3>
                  <p>
                    <strong>Location:</strong> {event[2]}
                  </p>
                  <p>
                    <strong>Date:</strong> {event[3]}
                  </p>
                  <p>
                    <strong>Available Tickets:</strong> {event[4]}
                  </p>

                  <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                    <button onClick={() => handleEdit(event)}>Edit</button>
                    <button onClick={() => handleDelete(event[0])}>Delete</button>
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