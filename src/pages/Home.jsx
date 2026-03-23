import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/events")
      .then((res) => {
        setEvents(res.data.events || []);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load events.");
      });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Available Events</h1>

      {error && <p>{error}</p>}

      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        events.map((event) => (
          <div
            key={event[0]}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "8px",
            }}
          >
            <h2>{event[1]}</h2>
            <p><strong>Location:</strong> {event[2]}</p>
            <p><strong>Date:</strong> {event[3]}</p>
            <p><strong>Available Tickets:</strong> {event[4]}</p>
            <Link to={`/event/${event[0]}`}>View Details</Link>
          </div>
        ))
      )}
    </div>
  );
}