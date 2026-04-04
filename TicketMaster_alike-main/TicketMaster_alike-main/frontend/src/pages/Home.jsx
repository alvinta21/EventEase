import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import EventCard from "../components/EventCard";
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
    <>
      <Navbar />

      <div className="page-container">
        <h1 className="page-title">Available Events</h1>

        {error && <p>{error}</p>}

        {events.length === 0 ? (
          <p style={{ textAlign: "center" }}>No events found.</p>
        ) : (
          events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        )}
      </div>
    </>
  );
}