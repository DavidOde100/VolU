import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EventManagementForm() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4">
            <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
                <h2 className="text-3xl font-bold text-center text-primary-900">Create an Event</h2>
                <form className="space-y-4">
                    <div>
                        <label htmlFor="eventName">Event Name:</label>
                        <input type="text" id="eventName" placeholder="Enter Event Name" required className="w-full p-2 border rounded"/>

                    </div>
                    <div>
                        <label htmlFor="eventDescription">Event Description:</label>
                        <textarea id="eventDescription" placeholder="Enter Event Description" required className="w-full p-2 border rounded"></textarea>
                    </div>
                    <div>
                        <label htmlFor="location">Location:</label>
                        <textarea id="location" placeholder="Enter Location" required className="w-full p-2 border rounded"></textarea>
                    </div>
                    <div>
                        <label htmlFor="requiredSkills">Required Skills:</label>
                        <select id="requiredSkills" multiple required className="w-full p-2 border rounded">
                            <option value="programming">Programming</option>
                            <option value="design">Design</option>
                            <option value="management">Management</option>
                            <option value="marketing">Marketing</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="urgency">Urgency:</label>
                        <select id="urgency" required className="w-full p-2 border rounded">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="eventDate">Event Date:</label>
                        <input type="date" id="eventDate" required className="w-full p-2 border rounded"/>
                    </div>
                    <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 mt-4">
                        Save Event
                    </Button>
                </form>
            </div>
        </div>
    );
}