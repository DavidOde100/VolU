"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Volunteer {
  id: number;
  name: string;
  skills: string[];
  availability: string[];
}

interface Event {
  id: number;
  name: string;
  requiredSkills: string[];
  date: string;
}

interface VolunteerHistory {
  id: number;
  volunteerName: string;
  eventName: string;
  date: string;
  status: string;
}

export default function VolunteeringMatchForm() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [history, setHistory] = useState<VolunteerHistory[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<number | null>(null);
  const [matchedEvent, setMatchedEvent] = useState<Event | null>(null);

  // Simulated API call (Replace with actual database fetching logic)
  useEffect(() => {
    setVolunteers([
      { id: 1, name: "John Doe", skills: ["Teaching", "Cooking"], availability: ["2025-02-20"] },
      { id: 2, name: "Jane Smith", skills: ["Construction", "First Aid"], availability: ["2025-02-22"] },
    ]);
    setEvents([
      { id: 1, name: "Community Kitchen", requiredSkills: ["Cooking"], date: "2025-02-20" },
      { id: 2, name: "Disaster Relief", requiredSkills: ["First Aid"], date: "2025-02-22" },
    ]);
    setHistory([
      { id: 1, volunteerName: "John Doe", eventName: "Community Kitchen", date: "2025-02-20", status: "Completed" },
      { id: 2, volunteerName: "Jane Smith", eventName: "Disaster Relief", date: "2025-02-22", status: "Pending" },
    ]);
  }, []);

  const handleMatch = (e: React.FormEvent) => {
    e.preventDefault(); // Prevents page reload
    if (selectedVolunteer !== null) {
      const volunteer = volunteers.find((v) => v.id === selectedVolunteer);
      const eventMatch = events.find((e) =>
        e.requiredSkills.some((skill) => volunteer?.skills.includes(skill))
      );
      setMatchedEvent(eventMatch || null);

      // If a match is found, add to history
      if (eventMatch) {
        setHistory((prev) => [
          ...prev,
          { id: prev.length + 1, volunteerName: volunteer?.name || "", eventName: eventMatch.name, date: eventMatch.date, status: "Assigned" }
        ]);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
        <h2 className="text-3xl font-bold text-center text-primary-900">Volunteer Matching</h2>

        {/* Volunteer Matching Form */}
        <form className="space-y-4" onSubmit={handleMatch}>
          <div>
            <label htmlFor="volunteer" className="block text-sm font-medium text-gray-700">
              Select Volunteer:
            </label>
            <select
              id="volunteer"
              onChange={(e) => setSelectedVolunteer(Number(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            >
              <option value="">-- Choose a Volunteer --</option>
              {volunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 mt-4">
            Match Volunteer
          </Button>
        </form>

        {/* Display Matched Event */}
        {matchedEvent && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <h2 className="text-xl font-semibold">Matched Event</h2>
            <p><strong>Event Name:</strong> {matchedEvent.name}</p>
            <p><strong>Date:</strong> {matchedEvent.date}</p>
          </div>
        )}
      </div>

      {/* Volunteer History Table */}
      <div className="w-full max-w-2xl mt-10">
        <h2 className="text-2xl font-bold text-center text-primary-900 mb-4">Volunteer History</h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Volunteer Name</th>
              <th className="border p-2">Event Name</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => (
              <tr key={record.id}>
                <td className="border p-2">{record.volunteerName}</td>
                <td className="border p-2">{record.eventName}</td>
                <td className="border p-2">{record.date}</td>
                <td className={`border p-2 ${record.status === "Completed" ? "text-green-500" : "text-red-500"}`}>
                  {record.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
