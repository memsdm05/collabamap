import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';

// ----- Helper Function: Haversine Distance -----
/**
 * Calculates the distance between two points on the Earth's surface using the Haversine formula.
 * @param {object} pos1 { lat: number, lng: number } - First position.
 * @param {object} pos2 { lat: number, lng: number } - Second position.
 * @returns {number} Distance in miles.
 */
function calculateDistance(pos1, pos2) {
    if (!pos1 || !pos2) {
        return Infinity; // Cannot calculate distance if one point is missing
    }
    const R = 6371; // Radius of the Earth in km
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a =
        0.5 - Math.cos(dLat)/2 +
        Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
        (1 - Math.cos(dLon))/2;

    const distanceKm = R * 2 * Math.asin(Math.sqrt(a));
    return distanceKm * 0.621371; // Convert km to miles
}

// Helper component for the Modal (no changes needed)
const EventFormModal = ({ isOpen, onClose, onSubmit, position, eventDetails, setEventDetails, isSubmitting }) => {
    // ... (Modal code remains the same as the previous version) ...
     if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(eventDetails); // Pass details up for submission
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md text-black">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Add New Event</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Location: Lat: {position.lat.toFixed(4)}, Lng: {position.lng.toFixed(4)}
                </p>
                <form onSubmit={handleSubmit}>
                    {/* Title */}
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text" id="title" name="title" value={eventDetails.title} onChange={handleChange} required disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                        />
                    </div>
                    {/* Description */}
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            id="description" name="description" value={eventDetails.description} onChange={handleChange} rows="3" required disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                        ></textarea>
                    </div>
                    {/* Category */}
                    <div className="mb-4">
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            id="category" name="category" value={eventDetails.category} onChange={handleChange} required disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100"
                        >
                            <option value="event">Event</option>
                            <option value="landmark">Landmark</option>
                        </select>
                    </div>
                    {/* Start Time */}
                    <div className="mb-4">
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                            type="datetime-local" id="startTime" name="startTime" value={eventDetails.startTime} onChange={handleChange} required disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                        />
                    </div>
                    {/* End Time */}
                    <div className="mb-4">
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                            type="datetime-local" id="endTime" name="endTime" value={eventDetails.endTime} onChange={handleChange} required disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                        />
                    </div>
                    {/* Buttons */}
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button" onClick={onClose} disabled={isSubmitting}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit" disabled={isSubmitting}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Simple component for the user location marker (Blue Dot)
const UserLocationMarker = () => (
    <div style={{
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: 'rgba(66, 133, 244, 0.7)', // Google Maps blue, slightly transparent
        border: '2px solid white',
        boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)',
        transform: 'translate(-50%, -50%)' // Center the dot on the coordinate
    }} />
);


// Main App Component
function App() {
    // ----- STATE -----
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [temporaryMarkerPosition, setTemporaryMarkerPosition] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
    const [newEventDetails, setNewEventDetails] = useState({
        title: '', description: '', category: 'event', startTime: '', endTime: '',
    });
    const defaultCenter = useMemo(() => ({ lat: 39.8283, lng: -98.5795 }), []);
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [initialZoom, setInitialZoom] = useState(4);
    const [currentUserPosition, setCurrentUserPosition] = useState(null); // *** NEW: Live user position
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [error, setError] = useState(null);
    const [proximityError, setProximityError] = useState(null); // *** NEW: Error for distance check
    const watchIdRef = useRef(null); // Ref to store the watchPosition ID

    // ----- CONSTANTS -----
    const API_BASE_URL = "https://collabamap.8ken.biz/api"; // Adjust if needed
    const EVENT_FETCH_RADIUS_MILES = 25;
    const EVENT_CREATION_RADIUS_MILES = 1.0; // *** NEW: Max distance for adding events

    // ----- EFFECTS -----

    // Effect 1: Get Initial Location & Start Watching Position
    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            setMapCenter(defaultCenter);
            setInitialZoom(4);
            setIsLoadingLocation(false);
            return;
        }

        let isMounted = true; // Flag to prevent state updates after unmount

        // --- Get Initial Position ---
        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (!isMounted) return;
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                console.log("User initial location obtained:", userLocation);
                setMapCenter(userLocation);
                setInitialZoom(11); // Zoom for ~10 mile radius
                setCurrentUserPosition(userLocation); // Set initial live position
                setError(null);
                setIsLoadingLocation(false);
            },
            (err) => {
                if (!isMounted) return;
                console.error("Error getting initial geolocation:", err);
                setError(`Error getting location: ${err.message}. Showing default location.`);
                setMapCenter(defaultCenter);
                setInitialZoom(4);
                setIsLoadingLocation(false);
                // Don't try to watch position if initial failed/denied
                isMounted = false; // Prevent watch setup
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 } // Request high accuracy
        );

        // --- Start Watching Position ---
        // Ensure we only start watching if the component is still mounted
        // (getCurrentPosition might have failed and set isMounted to false)
        if (isMounted && !watchIdRef.current) { // Start watching only if not already watching
             console.log("Starting geolocation watch...");
             watchIdRef.current = navigator.geolocation.watchPosition(
                // Success Callback (updates live position)
                (position) => {
                    const updatedLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    // console.log("User live location update:", updatedLocation);
                     if (isMounted) { // Check again before state update
                         setCurrentUserPosition(updatedLocation);
                         // Optionally clear proximity error if user moves back into range?
                         // Or let the next click handle it.
                     }
                },
                // Error Callback for watchPosition
                (err) => {
                    console.error("Error watching position:", err);
                    // Don't necessarily set the main error, could be temporary GPS glitch
                    // Could show a different, less intrusive warning if desired
                     if (isMounted) {
                        setError(prev => prev ? `${prev} | Watch Error: ${err.message}` : `Location Watch Error: ${err.message}`);
                     }
                },
                // Options for watchPosition
                {
                    enableHighAccuracy: true, // Keep tracking accurately
                    timeout: 10000,        // Timeout for each update attempt
                    maximumAge: 0         // Don't use cached positions for watching
                }
            );
             console.log("Watch started with ID:", watchIdRef.current);
        }


        // --- Cleanup Function ---
        return () => {
            isMounted = false; // Set flag on unmount
            if (watchIdRef.current) {
                console.log("Clearing geolocation watch ID:", watchIdRef.current);
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultCenter]); // Run only once on mount

    // Effect 2: Fetch initial events (no changes needed from previous version)
    useEffect(() => {
        if (isLoadingLocation || (mapCenter.lat === defaultCenter.lat && mapCenter.lng === defaultCenter.lng && isLoadingLocation)) {
            return;
        }
        const fetchEvents = async () => {
            console.log(`Fetching events around: Lat ${mapCenter.lat}, Lng ${mapCenter.lng}`);
            setIsLoadingEvents(true);
            setProximityError(null); // Clear proximity error when fetching new area
            setError(null);
            const url = `${API_BASE_URL}/events?lat=${mapCenter.lat}&lng=${mapCenter.lng}&radius=${EVENT_FETCH_RADIUS_MILES}`;
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}. ${errorData}`);
                }
                const fetchedEvents = await response.json();
                setEvents(fetchedEvents);
            } catch (err) {
                console.error("Error fetching initial events:", err);
                setError(`Failed to load events: ${err.message}`);
                setEvents([]);
            } finally {
                setIsLoadingEvents(false);
            }
        };
        fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapCenter, isLoadingLocation, API_BASE_URL]);


    // ----- EVENT HANDLERS -----

    // Handle clicking on the map - NOW INCLUDES DISTANCE CHECK
    const handleMapClick = useCallback((event) => {
        setSelectedEvent(null); // Close any open info window

        if (!event.detail.latLng) return; // No coordinates in click event

        const clickedPosition = {
            lat: event.detail.latLng.lat,
            lng: event.detail.latLng.lng,
        };

        // --- Proximity Check ---
        if (!currentUserPosition) {
            setTemporaryMarkerPosition(null); // Clear any existing temp marker
            setProximityError("Your current location is not available yet. Cannot place event.");
            return; // Exit if we don't know user's location
        }

        const distance = calculateDistance(currentUserPosition, clickedPosition);
        console.log(`Distance from current location: ${distance.toFixed(2)} miles`);

        if (distance <= EVENT_CREATION_RADIUS_MILES) {
            // Within allowed radius: place temporary marker
            setTemporaryMarkerPosition(clickedPosition);
            setProximityError(null); // Clear any previous proximity error
        } else {
            // Outside allowed radius: show error, don't place marker
            setTemporaryMarkerPosition(null); // Ensure no temporary marker is shown
            setProximityError(`You must be within ${EVENT_CREATION_RADIUS_MILES} mile(s) of your current location to add an event.`);
        }
        // --- End Proximity Check ---

    }, [currentUserPosition]); // Dependency: need current user position for check

    // Handle clicking the "Add New Event" button
    const handleAddEventClick = () => {
        if (temporaryMarkerPosition) {
            setNewEventDetails({ title: '', description: '', category: 'event', startTime: '', endTime: '' });
            setIsModalOpen(true);
            setProximityError(null); // Clear proximity error when opening modal
        }
    };

    // Handle closing the modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTemporaryMarkerPosition(null); // Clear temporary marker
        setIsSubmittingEvent(false);
        // Keep proximity error? Or clear it? Let's clear it.
        // setProximityError(null);
    };

    // Handle submitting the new event form (no changes needed from previous version)
    const handleEventSubmit = async (details) => {
        if (!temporaryMarkerPosition) return;
        setIsSubmittingEvent(true);
        setProximityError(null); // Clear error on submit attempt
        setError(null);
        const eventPayload = {
            ...details,
            position: temporaryMarkerPosition
        };
        const url = `${API_BASE_URL}/events`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventPayload),
            });
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to add event: ${response.status} ${response.statusText}. ${errorData}`);
            }
            const createdEvent = await response.json();
            setEvents(prevEvents => [...prevEvents, createdEvent]);
            handleCloseModal();
        } catch (err) {
            console.error("Error adding event:", err);
            setError(`Failed to add event: ${err.message}`);
            setIsSubmittingEvent(false);
        }
    };

    // Handle selecting a permanent event
    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setTemporaryMarkerPosition(null); // Clear temp marker
        setProximityError(null); // Clear proximity error
    };


    // ----- RENDER -----
    const mapKey = `${mapCenter.lat}-${mapCenter.lng}`;

    return (
        <div className="flex flex-col h-screen">
            <header className="bg-indigo-600 text-white p-4 shadow-md z-10 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-center">Event Mapper</h1>
                <div className='text-sm text-right'>
                    {isLoadingLocation && <span>Getting location...</span>}
                    {isLoadingEvents && <span>Loading events...</span>}
                    {/* Combine general and proximity errors for display */}
                    {(error || proximityError) && (
                         <span className="text-red-300 ml-2">
                            {error || ''} {error && proximityError ? '|' : ''} {proximityError || ''}
                        </span>
                    )}
                </div>
            </header>

            <div className="flex-grow relative">
                {!isLoadingLocation && (
                    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                        <Map
                            key={mapKey}
                            defaultCenter={mapCenter}
                            defaultZoom={initialZoom}
                            mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
                            gestureHandling="cooperative"
                            onClick={handleMapClick}
                            className="absolute inset-0 w-full h-full"
                            // *** NEW: Disable POI Clicks ***
                            clickableIcons={false}
                        >
                            {/* Render Permanent Event Markers */}
                            {events.map(event => (
                                <AdvancedMarker
                                    key={event.id}
                                    position={event.position}
                                    title={event.title}
                                    onClick={() => handleSelectEvent(event)}
                                >
                                    <Pin
                                        background={event.category === 'landmark' ? "#10B981" : "#4F46E5"}
                                        glyphColor={"#FFF"}
                                        borderColor={"#FFF"}
                                    />
                                </AdvancedMarker>
                            ))}

                            {/* Render Temporary Marker (if allowed by proximity) */}
                            {temporaryMarkerPosition && (
                                <AdvancedMarker
                                    position={temporaryMarkerPosition}
                                    title="New Event Location"
                                >
                                    <Pin background={"#F59E0B"} glyphColor={"#FFF"} borderColor={"#FFF"} />
                                </AdvancedMarker>
                            )}

                             {/* *** NEW: Render Live User Location Marker *** */}
                             {currentUserPosition && (
                                 <AdvancedMarker
                                    position={currentUserPosition}
                                    title="Your Location"
                                    // Prevent this marker from being selected like events
                                    // No onClick needed unless you want info on the blue dot
                                    zIndex={10} // Try to keep it above other markers if needed
                                 >
                                    <UserLocationMarker />
                                </AdvancedMarker>
                             )}


                            {/* Info Window for selected PERMANENT event */}
                            {selectedEvent && (
                                <InfoWindow
                                    position={selectedEvent.position}
                                    onCloseClick={() => setSelectedEvent(null)}
                                >
                                    {/* ... (InfoWindow content remains the same) ... */}
                                      <div className="text-black p-2 max-w-xs">
                                        <h3 className="font-bold text-lg mb-1">{selectedEvent.title}</h3>
                                        <p className="text-sm mb-1"><strong>Category:</strong> {selectedEvent.category}</p>
                                        <p className="text-sm mb-2">{selectedEvent.description}</p>
                                        <p className="text-xs text-gray-600">
                                            Starts: {selectedEvent.startTime ? new Date(selectedEvent.startTime).toLocaleString() : 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            Ends: {selectedEvent.endTime ? new Date(selectedEvent.endTime).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                </InfoWindow>
                            )}
                        </Map>
                    </APIProvider>
                )}
                {isLoadingLocation && (
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-20">
                        <p className="text-gray-700 text-xl">Initializing Map...</p>
                    </div>
                )}
            </div>

            {/* Bottom Tab */}
            <div className="bg-gray-800 text-white p-4 shadow-lg z-10">
                 {/* Display Proximity Error prominently if it exists */}
                 {proximityError && (
                     <div className="mb-2 p-2 bg-yellow-700 text-yellow-100 rounded-md text-sm text-center">{proximityError}</div>
                 )}
                  {/* Display general error if proximity error isn't shown */}
                 {error && !proximityError && (
                     <div className="mb-2 p-2 bg-red-800 text-red-100 rounded-md text-sm">{error}</div>
                 )}
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
                    {/* Event List */}
                    <div className="w-full md:w-2/3 mb-4 md:mb-0">
                        <h2 className="text-xl font-semibold mb-2">
                            Events {isLoadingEvents ? '(Loading...)' : `(${events.length})`}
                        </h2>
                        <div className="max-h-32 overflow-y-auto pr-2">
                            {/* ... (Event list rendering logic remains the same) ... */}
                             {events.length === 0 && !isLoadingEvents && (
                                <p className="text-gray-400">No events found or added yet.</p>
                            )}
                             {events.length === 0 && isLoadingEvents && (
                                <p className="text-gray-400">Loading events...</p>
                            )}
                            <ul className="space-y-2">
                                {events.map(event => (
                                    <li
                                        key={event.id}
                                        className="bg-gray-700 p-2 rounded-md cursor-pointer hover:bg-gray-600 transition-colors"
                                        onClick={() => handleSelectEvent(event)}
                                    >
                                        <p className="font-semibold">{event.title}</p>
                                        <p className="text-sm text-gray-300 truncate">{event.description}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Add Event Button */}
                    <div className="w-full md:w-auto flex justify-center md:justify-end">
                        <button
                            onClick={handleAddEventClick}
                            disabled={!temporaryMarkerPosition || isSubmittingEvent}
                            className={`px-6 py-3 rounded-lg font-semibold shadow-md transition-colors ${
                                temporaryMarkerPosition && !isSubmittingEvent
                                ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            }`}
                        >
                            Add New Event
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <EventFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleEventSubmit}
                position={temporaryMarkerPosition} // Will be null if modal shouldn't be open, but check above helps
                eventDetails={newEventDetails}
                setEventDetails={setNewEventDetails}
                isSubmitting={isSubmittingEvent}
            />
        </div>
    );
}

export default App;