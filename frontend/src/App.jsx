import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';

// ----- Helper Function: Haversine Distance -----
// MODIFIED: Returns distance in METERS
function calculateDistance(pos1, pos2) {
    if (!pos1 || !pos2) return Infinity;
    const R = 6371e3; // Earth radius in meters
    const phi1 = pos1.lat * Math.PI / 180; // φ, λ in radians
    const phi2 = pos2.lat * Math.PI / 180;
    const deltaPhi = (pos2.lat - pos1.lat) * Math.PI / 180;
    const deltaLambda = (pos2.lng - pos1.lng) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distanceMeters = R * c; // Distance in meters
    return distanceMeters;
}

// ----- Helper Function: Format distance for display -----
function formatDistance(meters) {
    if (meters < 1000) {
        return `${meters.toFixed(0)} meters`;
    } else {
        return `${(meters / 1000).toFixed(1)} km`;
    }
}


// ----- Helper Component: Modal ----- (No changes needed)
const EventFormModal = ({ isOpen, onClose, onSubmit, position, eventDetails, setEventDetails, isSubmitting }) => {
     if (!isOpen) return null;
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventDetails(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(eventDetails);
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md text-black">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Add New Event</h2>
                {position && <p className="text-sm text-gray-600 mb-4">
                    Location: Lat: {position.lat.toFixed(4)}, Lng: {position.lng.toFixed(4)}
                </p>}
                <form onSubmit={handleSubmit}>
                    {/* Form fields remain the same */}
                     <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input type="text" id="title" name="title" value={eventDetails.title} onChange={handleChange} required disabled={isSubmitting} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"/>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea id="description" name="description" value={eventDetails.description} onChange={handleChange} rows="3" required disabled={isSubmitting} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"></textarea>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select id="category" name="category" value={eventDetails.category} onChange={handleChange} required disabled={isSubmitting} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100">
                            <option value="event">Event</option>
                            <option value="landmark">Landmark</option>
                            <option value="Generic">Generic</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input type="datetime-local" id="startTime" name="startTime" value={eventDetails.startTime} onChange={handleChange} required disabled={isSubmitting} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"/>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input type="datetime-local" id="endTime" name="endTime" value={eventDetails.endTime} onChange={handleChange} required disabled={isSubmitting} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"/>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-wait">{isSubmitting ? 'Adding...' : 'Add Event'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ----- Helper Component: User Location Marker ----- (No changes needed)
const UserLocationMarker = () => (
    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgba(66, 133, 244, 0.7)', border: '2px solid white', boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)', transform: 'translate(-50%, -50%)' }} />
);

// ----- Main App Component -----
function App() {
    // ----- STATE -----
    const [appConfig, setAppConfig] = useState(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [configError, setConfigError] = useState(null);
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [temporaryMarkerPosition, setTemporaryMarkerPosition] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
    const [newEventDetails, setNewEventDetails] = useState({ title: '', description: '', category: 'event', startTime: '', endTime: '' });
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [error, setError] = useState(null);
    const [proximityError, setProximityError] = useState(null);
    const defaultCenter = useMemo(() => ({ lat: 39.8283, lng: -98.5795 }), []);
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [initialZoom, setInitialZoom] = useState(4);
    const [currentUserPosition, setCurrentUserPosition] = useState(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);
    const watchIdRef = useRef(null);

    // ----- CONSTANTS -----
    const API_BASE_URL = "/api";
    // Radii are now fetched from config (in meters)
    // EVENT_FETCH_RADIUS_MILES is still used for initial fetch, let's convert it later if needed or make it config based too
    const EVENT_FETCH_RADIUS_MILES = 25; // Keep this for now for GET /events

    // ----- Helper: Map Server Event to Frontend Event -----
    // Centralized function to handle mapping for both GET and POST
    const mapServerEventToState = (serverEvent) => {
        if (!serverEvent) return null;

        // --- Location Check ---
        let position = null;
        const coords = serverEvent.location?.coordinates;
        // IMPORTANT: Check if coords is an array with 2 valid numbers [lng, lat]
        if (Array.isArray(coords) && coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
            position = { lat: coords[1], lng: coords[0] };
        } else {
            console.warn("Received event with invalid location data:", serverEvent);
            // Optionally return null to filter out this event completely
            // return null;
        }

        // --- Time Check ---
        // Ensure times are valid strings before storing
        const startTime = typeof serverEvent.started_at === 'string' ? serverEvent.started_at : null;
        const endTime = typeof serverEvent.ended_at === 'string' ? serverEvent.ended_at : null;
         if (!startTime || !endTime) {
             console.warn("Received event with missing/invalid time data:", serverEvent);
             // Keep the event but times will show N/A, which seems to be the current behavior
         }


        return {
            id: serverEvent._id,
            title: serverEvent.title || 'Untitled Event', // Provide default
            description: serverEvent.description || '',
            category: serverEvent.category || 'Generic', // Provide default
            position: position, // This might be null if coords were invalid
            // Store the string directly, parsing happens during display
            startTime: startTime,
            endTime: endTime,
        };
    };


    // ----- EFFECTS -----

    // Effect 0: Fetch Configuration on Mount (No changes needed here)
    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoadingConfig(true); setConfigError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/config`);
                if (!response.ok) throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
                const configData = await response.json();
                if (!configData.maps_api_key) throw new Error("Maps API key missing from config response.");
                console.log("App Config Loaded:", configData); // Values are in METERS
                setAppConfig(configData);
            } catch (err) {
                console.error("Error fetching configuration:", err);
                setConfigError(`Config Load Failed: ${err.message}. Map functionality may be limited.`);
                setAppConfig(null);
            } finally {
                setIsLoadingConfig(false);
            }
        };
        fetchConfig();
    }, []); // Runs once


     // Effect 1: Get Initial Location & Start Watching Position (No changes needed here)
    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported."); setIsLoadingLocation(false); return;
        }
        let isMounted = true;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (!isMounted) return;
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                console.log("Initial location obtained:", loc);
                setMapCenter(loc); setInitialZoom(13); setCurrentUserPosition(loc); setError(null); setIsLoadingLocation(false); // Zoom in more
                if (!watchIdRef.current) {
                    watchIdRef.current = navigator.geolocation.watchPosition(
                        (updPos) => { if (isMounted) setCurrentUserPosition({ lat: updPos.coords.latitude, lng: updPos.coords.longitude }); },
                        (err) => { console.error("Watch err:", err); if (isMounted) setError(prev => `${prev || ''} | Watch Error: ${err.message}`); },
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                }
            },
            (err) => { if (!isMounted) return; setError(`Location Error: ${err.message}. Using default.`); setIsLoadingLocation(false); },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
        return () => { isMounted = false; if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultCenter]);

     // Effect 2: Fetch initial events (MODIFIED: Uses mapping function)
    useEffect(() => {
        if (isLoadingLocation || isLoadingConfig || !appConfig || mapCenter === defaultCenter) return;

        const fetchEvents = async () => {
            setIsLoadingEvents(true); setError(null); setProximityError(null);
            // Note: Backend /events GET endpoint might expect radius in meters or miles.
            // Assuming it expects miles for now based on previous constant name. Adjust if needed.
            const url = `${API_BASE_URL}/events?lat=${mapCenter.lat}&lng=${mapCenter.lng}&radius=${EVENT_FETCH_RADIUS_MILES}`;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Event fetch failed: ${response.status}`);
                const fetchedEventsFromServer = await response.json();

                // --- Use mapping function ---
                const formattedEvents = fetchedEventsFromServer
                    .map(mapServerEventToState) // Map each event
                    .filter(event => event !== null && event.position !== null); // Filter out events that failed mapping or had invalid location

                console.log("Formatted Events from GET:", formattedEvents);
                setEvents(formattedEvents);

            } catch (err) { setError(`Event Load failed: ${err.message}`); setEvents([]); }
            finally { setIsLoadingEvents(false); }
        };
        fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapCenter, isLoadingLocation, isLoadingConfig, appConfig]); // Depends on config loading


    // ----- EVENT HANDLERS -----

    // MODIFIED: Handle map click - Uses METERS from config
    const handleMapClick = useCallback((event) => {
        setSelectedEvent(null);
        if (!event.detail.latLng) return;

        if (!appConfig || !currentUserPosition) {
            setTemporaryMarkerPosition(null);
            setProximityError(appConfig ? "Current location unavailable." : "Configuration not loaded.");
            return;
        }

        const clickedPosition = { lat: event.detail.latLng.lat, lng: event.detail.latLng.lng };
        // Calculate distance in METERS
        const distanceMeters = calculateDistance(currentUserPosition, clickedPosition);
        // Get creation radius in METERS from config
        const creationRadiusMeters = appConfig.event_creation_radius;

        console.log(`Distance: ${distanceMeters.toFixed(1)}m, Radius: ${creationRadiusMeters}m`);

        if (distanceMeters <= creationRadiusMeters) {
            console.log("Click inside creation radius");
            setTemporaryMarkerPosition(clickedPosition);
            setProximityError(null);
        } else {
            console.log("Click outside creation radius");
            setTemporaryMarkerPosition(null);
            // Show error message with formatted distance (e.g., km)
            setProximityError(`Must be within ${formatDistance(creationRadiusMeters)} to add event.`);
        }
    }, [currentUserPosition, appConfig]); // Depends on appConfig

    // Handle add event click (No changes)
    const handleAddEventClick = () => {
        if (temporaryMarkerPosition) {
            setNewEventDetails({ title: '', description: '', category: 'event', startTime: '', endTime: '' });
            setIsModalOpen(true);
            setProximityError(null);
        }
    };

    // Handle close modal (No changes)
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTemporaryMarkerPosition(null);
        setIsSubmittingEvent(false);
    };

    // MODIFIED: Handle submitting the new event form - More robust checking
    const handleEventSubmit = async (details) => {
        // Ensure we have a valid temporary position before proceeding
        if (!temporaryMarkerPosition || typeof temporaryMarkerPosition.lat !== 'number' || typeof temporaryMarkerPosition.lng !== 'number') {
            setError("Invalid event location selected.");
            console.error("Attempted submit with invalid temporaryMarkerPosition:", temporaryMarkerPosition);
            return;
        }

        setIsSubmittingEvent(true);
        setProximityError(null);
        setError(null);

        // Use the validated temporary position for query params
        const submitLat = temporaryMarkerPosition.lat;
        const submitLng = temporaryMarkerPosition.lng;
        const url = `${API_BASE_URL}/events?lat=${submitLat}&lng=${submitLng}`;

        let requestBody;
        try {
            // Validate and Format Dates
            if (!details.startTime || !details.endTime) throw new Error("Start and end times are required.");
            const startTime = new Date(details.startTime);
            const endTime = new Date(details.endTime);
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) throw new Error("Invalid date format provided."); // Check if dates are valid
            if (endTime <= startTime) throw new Error("End time must be after start time.");

            const startTimeISO = startTime.toISOString();
            const endTimeISO = endTime.toISOString();

            requestBody = {
                title: details.title,
                description: details.description,
                category: details.category,
                start_time: startTimeISO,
                end_time: endTimeISO,
            };
        } catch (prepError) {
             console.error("Error preparing event data:", prepError);
             setError(`Data Error: ${prepError.message}`);
             setIsSubmittingEvent(false);
             return;
        }

        console.log("Submitting to URL:", url);
        console.log("Submitting Body:", JSON.stringify(requestBody)); // Log stringified body

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            // --- Handle Response ---
             const responseBodyText = await response.text(); // Get text first for better error reporting
             console.log("Server Response Status:", response.status);
             console.log("Server Response Body Text:", responseBodyText);

            if (response.ok) {
                 let createdEventFromServer;
                 try {
                     createdEventFromServer = JSON.parse(responseBodyText); // Parse JSON now
                 } catch (parseError) {
                     throw new Error(`Failed to parse successful response JSON: ${parseError.message}`);
                 }

                console.log("Successfully added event (Server Response Parsed):", createdEventFromServer);

                // --- Use mapping function ---
                const newEventForState = mapServerEventToState(createdEventFromServer);

                if (newEventForState && newEventForState.position) { // Ensure mapping was successful AND position is valid
                    setEvents(prevEvents => [...prevEvents, newEventForState]);
                    handleCloseModal();
                } else {
                    // This case handles if mapping failed or location was invalid in the response
                    console.error("Event created on server, but response data is invalid/incomplete:", createdEventFromServer);
                    setError("Event created, but failed to display it due to invalid response data (check console).");
                    setIsSubmittingEvent(false); // Keep modal open or handle differently
                }

            } else if (response.status === 422) {
                let errorData;
                 try { errorData = JSON.parse(responseBodyText); } catch { errorData = { detail: [{ msg: "Invalid validation response format" }] }; }
                console.error("Validation Error (422):", errorData);
                const errorMessages = errorData.detail?.map(err => `${err.loc?.join('.')} : ${err.msg}`).join('; ') || 'Validation failed.';
                setError(`Validation Error: ${errorMessages}`);
                setIsSubmittingEvent(false);
            } else {
                // Handle other errors (like 500, 404 etc.)
                throw new Error(`Failed to add event: ${response.status} ${response.statusText}. Response: ${responseBodyText}`);
            }

        } catch (err) {
            console.error("Error adding event:", err);
            // Display the underlying error message if available
            setError(`Failed to add event: ${err.message}`);
            setIsSubmittingEvent(false);
        }
    };

    // Handle selecting event (No changes)
    const handleSelectEvent = (event) => {
        console.log("Selected Event:", event); // Log the event being selected
        setSelectedEvent(event);
        setTemporaryMarkerPosition(null);
        setProximityError(null);
    };


    // ----- RENDER -----
    const mapKey = `${mapCenter.lat}-${mapCenter.lng}`;
    const isReadyToRenderMap = !isLoadingConfig && appConfig && !configError && !isLoadingLocation;

    // Helper to format date for display, handling potential errors
    const formatDisplayDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString();
        } catch (e) {
            console.error("Error formatting date string:", dateString, e);
            return 'Invalid Date';
        }
    };

    return (
        <div className="flex flex-col h-screen">
             {/* Header (Minor adjustments for clarity) */}
            <header className="bg-indigo-600 text-white p-4 shadow-md z-10 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Event Mapper</h1>
                <div className='text-sm text-right min-w-[200px]'>
                    {isLoadingConfig && <span>Loading Config...</span>}
                    {configError && <span className="text-red-300 ml-2">{configError}</span>}
                    {!isLoadingConfig && !configError && isLoadingLocation && <span>Locating...</span>}
                    {isReadyToRenderMap && isLoadingEvents && <span>Loading Events...</span>}
                    {/* Error display moved to bottom bar for less clutter */}
                </div>
            </header>

            {/* Map Area */}
            <div className="flex-grow relative">
                {/* Loading/Error Overlays */}
                {isLoadingConfig && ( <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-20"><p className="text-gray-700 text-xl">Loading Configuration...</p></div> )}
                {!isLoadingConfig && configError && ( <div className="absolute inset-0 bg-red-100 flex items-center justify-center z-20 p-4"><p className="text-red-700 text-xl text-center">{configError}</p></div> )}
                {!isLoadingConfig && !configError && isLoadingLocation && ( <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-20"><p className="text-gray-700 text-xl">Initializing Map & Location...</p></div> )}

                {/* Map Rendering */}
                {isReadyToRenderMap && appConfig?.maps_api_key && (
                    <APIProvider apiKey={appConfig.maps_api_key}>
                        <Map
                            key={mapKey}
                            defaultCenter={mapCenter}
                            defaultZoom={initialZoom}
                            mapId={appConfig.maps_api_key}
                            gestureHandling="cooperative"
                            onClick={handleMapClick}
                            className="absolute inset-0 w-full h-full"
                            clickableIcons={false}
                        >
                            {/* Event Markers - Filter out events without a valid position */}
                            {events.filter(event => event.position).map(event => (
                                <AdvancedMarker key={event.id} position={event.position} title={event.title} onClick={() => handleSelectEvent(event)}>
                                    <Pin background={event.category === 'landmark' ? "#10B981" : "#4F46E5"} glyphColor={"#FFF"} borderColor={"#FFF"}/>
                                </AdvancedMarker>
                            ))}
                            {/* Temporary Marker */}
                            {temporaryMarkerPosition && (
                                <AdvancedMarker position={temporaryMarkerPosition} title="New Event Location">
                                    <Pin background={"#F59E0B"} glyphColor={"#FFF"} borderColor={"#FFF"} />
                                </AdvancedMarker>
                            )}
                            {/* User Location Marker */}
                             {currentUserPosition && (
                                 <AdvancedMarker position={currentUserPosition} title="Your Location" zIndex={10}>
                                    <UserLocationMarker />
                                </AdvancedMarker>
                             )}
                             {/* Info Window - Check position and use safe date formatter */}
                             {selectedEvent && selectedEvent.position && (
                                <InfoWindow
                                    position={selectedEvent.position}
                                    onCloseClick={() => setSelectedEvent(null)}
                                >
                                     <div className="text-black p-2 max-w-xs">
                                        <h3 className="font-bold text-lg mb-1">{selectedEvent.title}</h3>
                                        <p className="text-sm mb-1"><strong>Category:</strong> {selectedEvent.category}</p>
                                        <p className="text-sm mb-2">{selectedEvent.description}</p>
                                        {/* Use safe date formatter */}
                                        <p className="text-xs text-gray-600">Starts: {formatDisplayDate(selectedEvent.startTime)}</p>
                                        <p className="text-xs text-gray-600">Ends: {formatDisplayDate(selectedEvent.endTime)}</p>
                                    </div>
                                </InfoWindow>
                             )}
                        </Map>
                    </APIProvider>
                )}
            </div>

            {/* Bottom Tab (Error display added here) */}
            <div className="bg-gray-800 text-white p-4 shadow-lg z-10">
                 {/* Combined Error Display Area */}
                 {(proximityError || error) && (
                    <div className={`mb-2 p-2 rounded-md text-sm text-center ${
                        error ? 'bg-red-800 text-red-100' : 'bg-yellow-700 text-yellow-100' // Prioritize general error styling
                    }`}>
                        {error || proximityError} {/* Display general error if present, otherwise proximity */}
                    </div>
                 )}

                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
                     {/* Event List */}
                    <div className="w-full md:w-2/3 mb-4 md:mb-0">
                        <h2 className="text-xl font-semibold mb-2">Events {isLoadingEvents ? '(Loading...)' : `(${events.length})`}</h2>
                        <div className="max-h-32 overflow-y-auto pr-2">
                            {!isLoadingConfig && !isLoadingEvents && events.length === 0 && (<p className="text-gray-400">No events found nearby or added yet.</p>)}
                            {(isLoadingConfig || isLoadingEvents) && (<p className="text-gray-400">Loading...</p>)}
                            <ul className="space-y-2">
                                {events.map(event => (
                                    <li key={event.id} className="bg-gray-700 p-2 rounded-md cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => handleSelectEvent(event)}>
                                        <p className="font-semibold">{event.title}</p>
                                        <p className="text-sm text-gray-300 truncate">{event.description}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    {/* Add Button */}
                     <div className="w-full md:w-auto flex justify-center md:justify-end">
                        <button
                            onClick={handleAddEventClick}
                            disabled={!temporaryMarkerPosition || isSubmittingEvent || isLoadingConfig || !appConfig || isLoadingLocation}
                            className={`px-6 py-3 rounded-lg font-semibold shadow-md transition-colors ${
                                temporaryMarkerPosition && !isSubmittingEvent && appConfig && !isLoadingLocation
                                    ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            }`}
                            title={
                                !appConfig ? "Waiting for configuration..." :
                                !currentUserPosition ? "Waiting for location..." :
                                !temporaryMarkerPosition ? `Click on the map within ${appConfig ? formatDistance(appConfig.event_creation_radius) : 'allowed radius'} to select location` :
                                isSubmittingEvent ? "Submitting event..." :
                                "Add New Event at Selected Location"
                            }
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
                position={temporaryMarkerPosition}
                eventDetails={newEventDetails}
                setEventDetails={setNewEventDetails}
                isSubmitting={isSubmittingEvent}
            />
        </div>
    );
}

export default App;