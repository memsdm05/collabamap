import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';
import InstallPWA from './components/InstallPWA';

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

// ----- Helper Component: User Location Marker -----
const UserLocationMarker = () => (
    <div style={{
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: 'rgba(66, 133, 244, 0.7)',
        border: '2px solid white',
        boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)',
        transform: 'translate(-50%, -50%)', // This centers the div itself
        boxSizing: 'border-box', // Ensure border doesn't add to size unexpectedly
        margin: 0, // Ensure no margin
        padding: 0, // Ensure no padding
     }} />
);

// ----- Helper Component: Modal -----
const EventFormModal = ({ isOpen, onClose, onSubmit, position, eventDetails, setEventDetails, isSubmitting }) => {
    if (!isOpen) return null;

   const isLandmark = eventDetails.category === 'landmark';

   const handleChange = (e) => {
       const { name, value } = e.target;
       setEventDetails(prev => {
           const newState = { ...prev, [name]: value };
           // If category changes TO landmark, clear times
           if (name === 'category' && value === 'landmark') {
               newState.startTime = '';
               newState.endTime = '';
           }
           return newState;
       });
   };

   const handleSubmit = (e) => {
       e.preventDefault();
       // Prepare details for submission (handle landmark case in App component's submit handler)
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
                   {/* Title */}
                   <div className="mb-4">
                       <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                       <input type="text" id="title" name="title" value={eventDetails.title} maxLength={25} onChange={handleChange} required disabled={isSubmitting} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"/>
                   </div>
                   {/* Description */}
                   <div className="mb-4">
                       <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                       <textarea id="description" name="description" value={eventDetails.description} maxLength={40} onChange={handleChange} rows="3" required disabled={isSubmitting} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"></textarea>
                   </div>
                   {/* Category */}
                   <div className="mb-4">
                       <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                       <select id="category" name="category" value={eventDetails.category} onChange={handleChange} required disabled={isSubmitting} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100">
                           <option value="event">Event</option>
                           <option value="landmark">Landmark</option>
                           {/* 'Generic' removed */}
                       </select>
                   </div>

                   {/* Conditional Time Inputs */}
                   {!isLandmark && (
                       <>
                           <div className="mb-4">
                               <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                               <input
                                   type="datetime-local" id="startTime" name="startTime"
                                   value={eventDetails.startTime} onChange={handleChange}
                                   required={!isLandmark} // Only required if it's an event
                                   disabled={isSubmitting}
                                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"/>
                           </div>
                           <div className="mb-4">
                               <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                               <input
                                   type="datetime-local" id="endTime" name="endTime"
                                   value={eventDetails.endTime} onChange={handleChange}
                                   required={!isLandmark} // Only required if it's an event
                                   disabled={isSubmitting}
                                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"/>
                           </div>
                       </>
                   )}
                    {/* Show note for Landmarks */}
                    {isLandmark && (
                       <p className="text-sm text-gray-500 mb-4">Start and end times are not applicable for landmarks.</p>
                    )}


                   {/* Buttons */}
                   <div className="flex justify-end space-x-3 mt-6">
                       <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50">Cancel</button>
                       <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-wait">{isSubmitting ? 'Adding...' : 'Add Item'}</button> {/* Changed button text slightly */}
                   </div>
               </form>
           </div>
       </div>
   );
};


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
   // MODIFIED: Default category is 'event'
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
   const EVENT_FETCH_RADIUS_MILES = 25;

   // ----- Helper Functions ----- (Keep calculateDistance and formatDistance)
   // Function calculateDistance...
   // Function formatDistance...
    // ----- Helper Function: Haversine Distance -----
   function calculateDistance(pos1, pos2) {
       if (!pos1 || !pos2) return Infinity;
       const R = 6371e3; // Earth radius in meters
       const phi1 = pos1.lat * Math.PI / 180;
       const phi2 = pos2.lat * Math.PI / 180;
       const deltaPhi = (pos2.lat - pos1.lat) * Math.PI / 180;
       const deltaLambda = (pos2.lng - pos1.lng) * Math.PI / 180;
       const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
       return R * c;
   }
   // ----- Helper Function: Format distance -----
   function formatDistance(meters) {
       if (meters < 1000) return `${meters.toFixed(0)} meters`;
       return `${(meters / 1000).toFixed(1)} km`;
   }


   // MODIFIED: Helper: Map Server Event to Frontend Event
   const mapServerEventToState = (serverEvent) => {
       if (!serverEvent) return null;

       let position = null;
       const coords = serverEvent.location?.coordinates;
       // LOGGING: Log received coordinates
       console.log(`Mapping server event ${serverEvent._id}. Received coords:`, coords);
       // Check for valid GeoJSON coordinates [lng, lat]
       if (Array.isArray(coords) && coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
           // CORRECT MAPPING: lng is coords[0], lat is coords[1]
           position = { lat: coords[0], lng: coords[1] };
       } else {
           console.warn(`Event ${serverEvent._id} has invalid location data:`, serverEvent.location);
       }

       // Only assign times if they are valid strings AND it's not a landmark
       const isLandmarkCategory = serverEvent.category === 'landmark';
       const startTime = !isLandmarkCategory && typeof serverEvent.started_at === 'string' ? serverEvent.started_at : null;
       const endTime = !isLandmarkCategory && typeof serverEvent.ended_at === 'string' ? serverEvent.ended_at : null;
       if (!isLandmarkCategory && (!startTime || !endTime) && serverEvent.started_at !== undefined) { // Avoid warning if landmark times are just missing
            console.warn(`Event ${serverEvent._id} (category: ${serverEvent.category}) has missing/invalid time data:`, {start: serverEvent.started_at, end: serverEvent.started_at });
       }

       return {
           id: serverEvent._id,
           title: serverEvent.title || 'Untitled',
           description: serverEvent.description || '',
           // Fallback to 'event' if category is missing or unexpected
           category: serverEvent.category === 'event' || serverEvent.category === 'landmark' ? serverEvent.category : 'event',
           position: position, // Can be null if coords were invalid
           startTime: startTime, // Null if landmark or invalid
           endTime: endTime,     // Null if landmark or invalid
       };
   };


   // ----- EFFECTS -----

   // Effect 0: Fetch Configuration on Mount (No changes)
   useEffect(() => {
       // ... fetch config logic ...
         const fetchConfig = async () => {
           setIsLoadingConfig(true); setConfigError(null);
           try {
               const response = await fetch(`${API_BASE_URL}/config`);
               if (!response.ok) throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
               const configData = await response.json();
               if (!configData.maps_api_key) throw new Error("Maps API key missing from config response.");
               console.log("App Config Loaded:", configData);
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
   }, []);

    // Effect 1: Get Initial Location & Start Watching Position (No changes)
   useEffect(() => {
       // ... geolocation logic ...
        if (!navigator.geolocation) {
           setError("Geolocation is not supported."); setIsLoadingLocation(false); return;
       }
       let isMounted = true;
       navigator.geolocation.getCurrentPosition(
           (pos) => {
               if (!isMounted) return;
               const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
               console.log("Initial location obtained:", loc);
               setMapCenter(loc); setInitialZoom(13); setCurrentUserPosition(loc); setError(null); setIsLoadingLocation(false);
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


    // Effect 2: Fetch initial events AND set up polling (Uses updated mapping function)
    useEffect(() => {
        if (isLoadingLocation || isLoadingConfig || !appConfig || mapCenter === defaultCenter) return;

        const fetchEvents = async () => {
            setIsLoadingEvents(true);
            setError(null);
            setProximityError(null);
            const url = `${API_BASE_URL}/events?lat=${mapCenter.lat}&lng=${mapCenter.lng}&radius=${EVENT_FETCH_RADIUS_MILES}`;
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Event fetch failed: ${response.status}`);
                }
                const fetchedEventsFromServer = await response.json();

                const formattedEvents = fetchedEventsFromServer
                    .map(mapServerEventToState) // Use updated mapping
                    .filter(event => event !== null && event.position !== null);

                // Calculate and add distance to each event
                const eventsWithDistance = formattedEvents.map(event => ({
                    ...event,
                    distance: currentUserPosition ? calculateDistance(currentUserPosition, event.position) : null,
                }));


                console.log("Formatted Events from GET:", formattedEvents);
                setEvents(eventsWithDistance);

            } catch (err) {
                setError(`Event Load failed: ${err.message}`);
                setEvents([]);
            } finally {
                setIsLoadingEvents(false);
            }
        };

        // Initial fetch
        fetchEvents();

        // Set up interval to fetch events every 5 seconds
        const intervalId = setInterval(fetchEvents, 5000);

        // Clean up interval on unmount
        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapCenter, isLoadingLocation, isLoadingConfig, appConfig, currentUserPosition]);

   // ----- EVENT HANDLERS -----

   // handleMapClick (Uses updated default category)
   const handleMapClick = useCallback((event) => {
       setSelectedEvent(null);
       if (!event.detail.latLng) return;
       if (!appConfig || !currentUserPosition) {
           setTemporaryMarkerPosition(null);
           setProximityError(appConfig ? "Current location unavailable." : "Configuration not loaded.");
           return;
       }

       const clickedPosition = { lat: event.detail.latLng.lat, lng: event.detail.latLng.lng };
       const distanceMeters = calculateDistance(currentUserPosition, clickedPosition);
       const creationRadiusMeters = appConfig.event_creation_radius;

       // Check if the click is inside existing event radius
       const isInsideExistingEvent = events.some(existingEvent => {
           if (!existingEvent.position) return false;
           const distanceToExistingEvent = calculateDistance(clickedPosition, existingEvent.position);
           return distanceToExistingEvent <= appConfig.event_radius;
       });

       if (distanceMeters <= creationRadiusMeters && !isInsideExistingEvent) {
           // Reset details with 'event' as default category when placing marker
           setNewEventDetails({ title: '', description: '', category: 'event', startTime: '', endTime: '' });
           setTemporaryMarkerPosition(clickedPosition);
           setProximityError(null);
       } else {
           setTemporaryMarkerPosition(null);
           if (isInsideExistingEvent) {
               setProximityError("Cannot create event inside another event's radius.");
           } else {
               setProximityError(`Must be within ${formatDistance(creationRadiusMeters)} to add event.`);
           }
       }
   }, [currentUserPosition, appConfig, events]);

   // handleAddEventClick (No changes)
   const handleAddEventClick = () => {
       if (temporaryMarkerPosition) {
           // setNewEventDetails is already reset in handleMapClick, just open modal
           setIsModalOpen(true);
           setProximityError(null);
       }
   };

   // handleCloseModal (No changes)
   const handleCloseModal = () => {
       setIsModalOpen(false);
       setTemporaryMarkerPosition(null);
       setIsSubmittingEvent(false);
   };

   // MODIFIED: Handle submitting the new event form
   const handleEventSubmit = async (details) => {
       if (!temporaryMarkerPosition || typeof temporaryMarkerPosition.lat !== 'number' || typeof temporaryMarkerPosition.lng !== 'number') {
           setError("Invalid event location selected.");
           return;
       }

       setIsSubmittingEvent(true);
       setProximityError(null);
       setError(null);

       // Explicitly get lat and lng for the request
       const submitLat = temporaryMarkerPosition.lat;
       const submitLng = temporaryMarkerPosition.lng;
       const url = `${API_BASE_URL}/events?lat=${submitLat}&lng=${submitLng}`;

       // LOGGING: Log the exact Lat/Lng being sent in query params
       console.log(`Submitting to URL: ${url}`);

       let requestBody = {
           title: details.title,
           description: details.description,
           category: details.category,
           // start_time and end_time will be added conditionally below
       };

       const isLandmark = details.category === 'landmark';

       try {
           // Only validate and add times if it's NOT a landmark
           if (!isLandmark) {
               if (!details.startTime || !details.endTime) throw new Error("Start and end times are required for events.");
               const startTime = new Date(details.startTime);
               const endTime = new Date(details.endTime);
               if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) throw new Error("Invalid date format provided.");
               if (endTime <= startTime) throw new Error("End time must be after start time.");

               requestBody.start_time = startTime.toISOString();
               requestBody.end_time = endTime.toISOString();
           } else {
               // Ensure times are not sent for landmarks (explicitly null or omitted)
                requestBody.start_time = null; // Or omit entirely
                requestBody.end_time = null;   // Or omit entirely
           }

       } catch (prepError) {
            console.error("Error preparing event data:", prepError);
            setError(`Data Error: ${prepError.message}`);
            setIsSubmittingEvent(false);
            return;
       }

       console.log("Submitting Body:", JSON.stringify(requestBody));

       try {
           const response = await fetch(url, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(requestBody),
           });

            const responseBodyText = await response.text();
            console.log("Server Response Status:", response.status);
            // Avoid logging large potentially sensitive data in production
            // console.log("Server Response Body Text:", responseBodyText);

           if (response.ok) {
                let createdEventFromServer;
                try { createdEventFromServer = JSON.parse(responseBodyText); }
                catch (parseError) { throw new Error(`Failed to parse successful response JSON: ${parseError.message}`); }

               console.log("Successfully added item (Server Response Parsed):", createdEventFromServer);

               // Use mapping function (which now handles landmark times and has coordinate logging)
               const newEventForState = mapServerEventToState(createdEventFromServer);

               // Check validity before adding
               if (newEventForState && newEventForState.position) {
                   setEvents(prevEvents => [...prevEvents, newEventForState]);
                   handleCloseModal();
               } else {
                   console.error("Item created on server, but response data is invalid/incomplete:", createdEventFromServer);
                   setError("Item created, but failed to display it due to invalid response data (check console).");
                   setIsSubmittingEvent(false);
               }

           } else if (response.status === 422) {
               // ... validation error handling ...
               let errorData;
                try { errorData = JSON.parse(responseBodyText); } catch { errorData = { detail: [{ msg: "Invalid validation response format" }] }; }
               console.error("Validation Error (422):", errorData);
               const errorMessages = errorData.detail?.map(err => `${err.loc?.join('.')} : ${err.msg}`).join('; ') || 'Validation failed.';
               setError(`Validation Error: ${errorMessages}`);
               setIsSubmittingEvent(false);

           } else {
               // ... other error handling ...
                throw new Error(`Failed to add item: ${response.status} ${response.statusText}. Response: ${responseBodyText}`);
           }

       } catch (err) {
           console.error("Error adding item:", err);
           setError(`Failed to add item: ${err.message}`);
           setIsSubmittingEvent(false);
       }
   };

   // handleSelectEvent (No changes)
   const handleSelectEvent = (event) => {
       console.log("Selected Item:", event);
       setSelectedEvent(event);
       setTemporaryMarkerPosition(null);
       setProximityError(null);
   };


   // ----- RENDER -----
   const mapKey = `${mapCenter.lat}-${mapCenter.lng}`;
   const isReadyToRenderMap = !isLoadingConfig && appConfig && !configError && !isLoadingLocation;

   const formatDisplayDate = (dateString) => {
       // ... date formatting helper (no changes needed here) ...
        if (!dateString) return 'N/A';
       try {
           return new Date(dateString).toLocaleString();
       } catch (e) {
           console.error("Error formatting date string:", dateString, e);
           return 'Invalid Date';
       }
   };

   // Define the CircleOverlay component
   const CircleOverlay = ({ center, radius }) => {
       const mapRef = useRef(null);

       useEffect(() => {
           if (!center || !radius || !mapRef.current) return;
            console.log("Make a da circle!");
           const circle = new window.google.maps.Circle({
               strokeColor: '#701614',
               strokeOpacity: 0.5,
               strokeWeight: 1,
               fillColor: '#701614',
               fillOpacity: 0.15,
               map: mapRef.current,
               center: center,
               radius: radius,
           });

           return () => {
               circle.setMap(null); // Clean up the circle when the component unmounts
           };
       }, [center, radius]);

       return null;
   };

   return (
       <div className="flex flex-col h-screen">
            {/* Header (No changes) */}
            <header className="bg-indigo-600 text-white p-4 shadow-md z-10 flex justify-between items-center">
                {/* ... header content ... */}
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold">CollabaMap</h1>
                    <p className="text-sm italic mt-1">Pick a location near you and create an event or landmark!</p>
                </div>
               {/* <div className='text-sm text-right min-w-[150px]'>
                   {isLoadingConfig && <span>Loading Config...</span>}
                   {configError && <span className="text-red-300 ml-2">{configError}</span>}
                   {!isLoadingConfig && !configError && isLoadingLocation && <span>Locating...</span>}
                   {isReadyToRenderMap && isLoadingEvents && <span></span>}
               </div> */}
            </header>

           {/* Map Area */}
           <div className="flex-grow relative">
               {/* Loading/Error Overlays (No changes) */}
               {/* ... loading overlays ... */}
               {isLoadingConfig && ( <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-20"><p className="text-gray-700 text-xl">Loading Configuration...</p></div> )}
               {!isLoadingConfig && configError && ( <div className="absolute inset-0 bg-red-100 flex items-center justify-center z-20 p-4"><p className="text-red-700 text-xl text-center">{configError}</p></div> )}
               {!isLoadingConfig && !configError && isLoadingLocation && ( <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-20"><p className="text-gray-700 text-xl">Initializing Map & Location...</p></div> )}


               {/* Map Rendering */}
               {isReadyToRenderMap && appConfig?.maps_api_key && (
                   <APIProvider apiKey={appConfig.maps_api_key}>
                       <Map /* ... map props ... */
                           key={mapKey}
                           defaultCenter={mapCenter}
                           defaultZoom={initialZoom}
                           mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
                           gestureHandling="auto"
                           onClick={handleMapClick}
                           className="absolute inset-0 w-full h-full"
                           clickableIcons={false}
                       >
                           {/* Event/Landmark Markers */}
                           {events.filter(event => event.position).map(event => (
                               <AdvancedMarker key={event.id} position={event.position} title={event.title} onClick={() => handleSelectEvent(event)}>
                                   {/* Pin color remains based on category */}
                                   <Pin background={event.category === 'landmark' ? "#10B981" : "#4F46E5"} glyphColor={"#FFF"} borderColor={"#FFF"}/>
                               </AdvancedMarker>
                           ))}
                           {/* Temporary Marker (No changes) */}
                           {temporaryMarkerPosition && ( <AdvancedMarker position={temporaryMarkerPosition} title="New Item Location"><Pin background={"#F59E0B"} glyphColor={"#FFF"} borderColor={"#FFF"} /></AdvancedMarker> )}
                           {/* User Location Marker (Uses updated CSS Component) */}
                            {currentUserPosition && ( <AdvancedMarker position={currentUserPosition} title="Your Location" zIndex={10}><UserLocationMarker /></AdvancedMarker> )}

                            // ... existing code ...

                            {/* MODIFIED: Info Window - Added Voting Buttons */}
                            {selectedEvent && selectedEvent.position && (
                            <InfoWindow
                                position={selectedEvent.position}
                                onCloseClick={() => setSelectedEvent(null)}
                            >
                                <div className="text-black p-2 max-w-xs">
                                    {/* Title and Vote Buttons Row */}
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-lg">{selectedEvent.title}</h3>
                                        <div className="flex gap-1">
                                            <button 
                                                className="bg-green-500 hover:bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const button = e.currentTarget;
                                                    fetch(`/api/events/${selectedEvent.id}/reports?lat=${mapCenter.lat}&lng=${mapCenter.lng}`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                        },
                                                        body: JSON.stringify({ score: 1 }),
                                                    })
                                                    .then(response => {
                                                        if (!response.ok) {
                                                            throw new Error('Failed to upvote');
                                                        }
                                                        console.log('Upvote successful:', selectedEvent.id);
                                                        // Play bounce animation
                                                        button.animate([
                                                            { transform: 'scale(1)' },
                                                            { transform: 'scale(1.3)' },
                                                            { transform: 'scale(1)' }
                                                        ], {
                                                            duration: 300,
                                                            easing: 'ease-in-out'
                                                        });
                                                        // Update score after upvote
                                                        return fetch(`/api/events/${selectedEvent.id}/score?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
                                                    })
                                                    .then(response => {
                                                        if (!response.ok) {
                                                            throw new Error('Failed to fetch score');
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(data => {
                                                        const scoreElement = document.getElementById(`score-${selectedEvent.id}`);
                                                        if (scoreElement) {
                                                            const roundedScore = Math.round(data.score * 100) / 100;
                                                            scoreElement.textContent = `Score: ${roundedScore}`;
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error('Error upvoting or fetching score:', error);
                                                    });
                                                }}
                                            >
                                                ↑
                                            </button>
                                            <button 
                                                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const button = e.currentTarget;
                                                    fetch(`/api/events/${selectedEvent.id}/reports?lat=${mapCenter.lat}&lng=${mapCenter.lng}`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                        },
                                                        body: JSON.stringify({ score: -1 }),
                                                    })
                                                    .then(response => {
                                                        if (!response.ok) {
                                                            throw new Error('Failed to downvote');
                                                        }
                                                        console.log('Downvote successful:', selectedEvent.id);
                                                        // Play bounce animation
                                                        button.animate([
                                                            { transform: 'scale(1)' },
                                                            { transform: 'scale(1.3)' },
                                                            { transform: 'scale(1)' }
                                                        ], {
                                                            duration: 300,
                                                            easing: 'ease-in-out'
                                                        });
                                                        // Update score after downvote
                                                        return fetch(`/api/events/${selectedEvent.id}/score?lat=${mapCenter.lat}&lng=${mapCenter.lng}`);
                                                    })
                                                    .then(response => {
                                                        if (!response.ok) {
                                                            throw new Error('Failed to fetch score');
                                                        }
                                                        return response.json();
                                                    })
                                                    .then(data => {
                                                        const scoreElement = document.getElementById(`score-${selectedEvent.id}`);
                                                        if (scoreElement) {
                                                            const roundedScore = Math.round(data.score * 100) / 100;
                                                            scoreElement.textContent = `Score: ${roundedScore}`;
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error('Error downvoting or fetching score:', error);
                                                    });
                                                }}
                                            >
                                                ↓
                                            </button>
                                        </div>
                                    </div>
                                    {/* Category */}
                                    <p className="text-sm mb-1 capitalize">
                                        <strong>Category:</strong> {selectedEvent.category}
                                    </p>
                                    <p className="text-sm mb-2">{selectedEvent.description}</p>

                                    {/* Score Display */}
                                    <button 
                                        id={`score-${selectedEvent.id}`}
                                        className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded mb-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const button = e.currentTarget;
                                            fetch(`/api/events/${selectedEvent.id}/score?lat=${mapCenter.lat}&lng=${mapCenter.lng}`)
                                                .then(response => {
                                                    if (!response.ok) {
                                                        throw new Error('Failed to fetch score');
                                                    }
                                                    return response.json();
                                                })
                                                .then(data => {
                                                    const scoreElement = e.target;
                                                    const roundedScore = Math.round(data.score * 100) / 100;
                                                    scoreElement.textContent = `Score: ${roundedScore}`;
                                                    scoreElement.disabled = true;
                                                    scoreElement.classList.remove('hover:bg-blue-200');
                                                    // Play bounce animation
                                                    button.animate([
                                                        { transform: 'scale(1)' },
                                                        { transform: 'scale(1.1)' },
                                                        { transform: 'scale(1)' }
                                                    ], {
                                                        duration: 300,
                                                        easing: 'ease-in-out'
                                                    });
                                                })
                                                .catch(error => {
                                                    console.error('Error fetching score:', error);
                                                });
                                        }}
                                    >
                                        Click to view score
                                    </button>

                                {/* Conditionally display times only for 'event' category */}
                                {selectedEvent.category === 'event' && (
                                    <>
                                        <p className="text-xs text-gray-600">Starts: {formatDisplayDate(selectedEvent.startTime)}</p>
                                        <p className="text-xs text-gray-600">Ends: {formatDisplayDate(selectedEvent.endTime)}</p>
                                    </>
                                )}
                            </div>
                        </InfoWindow>
                        )}                            
                        {/* Render CircleOverlay for each event */}
                        {events.map(event => (
                            <CircleOverlay key={event.id} center={event.position} radius={appConfig.event_radius} />
                        ))}
                   </Map>
               </APIProvider>
           )}
       </div>

       {/* Bottom Tab (No structural changes needed, button title updates) */}
       <div className="bg-gray-800 text-white p-4 shadow-lg z-10">
           {/* Error Display Area (No changes) */}
            {(proximityError || error) && ( <div className={`mb-2 p-2 rounded-md text-sm text-center ${ error ? 'bg-red-800 text-red-100' : 'bg-yellow-700 text-yellow-100'}`}> {error || proximityError} </div> )}

               <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
                    {/* Event List (No changes) */}
                   <div className="w-full md:w-2/3 mb-4 md:mb-0">
                       <h2 className="text-xl font-semibold mb-2">Nearby Items {isLoadingEvents ? `(${events.length})` : `(${events.length})`}</h2>
                       <div className="max-h-32 overflow-y-auto pr-2">
                          {/* ... list loading/empty states ... */}
                          {!isLoadingConfig && !isLoadingEvents && events.length === 0 && (<p className="text-gray-400">No items found nearby or added yet.</p>)}
                           {(isLoadingConfig || isLoadingEvents) && (<p className="text-gray-400"></p>)}
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
                   {/* Add Button and Install Button */}
                    <div className="w-full md:w-auto flex justify-center md:justify-end space-x-4">
                       <InstallPWA />
                       <button
                           onClick={handleAddEventClick}
                           disabled={!temporaryMarkerPosition || isSubmittingEvent || isLoadingConfig || !appConfig || isLoadingLocation}
                           className={`px-6 py-3 rounded-lg font-semibold shadow-md transition-colors ${ temporaryMarkerPosition && !isSubmittingEvent && appConfig && !isLoadingLocation ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
                           title={ /* Dynamic title */
                               !appConfig ? "Waiting for configuration..." :
                               !currentUserPosition ? "Waiting for location..." :
                               !temporaryMarkerPosition ? `Click on the map within ${appConfig ? formatDistance(appConfig.event_creation_radius) : 'allowed radius'} to select location`:
                               isSubmittingEvent ? "Submitting..." :
                               "Add New Item at Selected Location" // Generic "Item"
                               }
                               >
                               Add New Item {/* Generic "Item" */}
                               </button>
                               </div>
                               </div>
                               </div>{/* Modal (Uses updated Modal component) */}
       <EventFormModal
           isOpen={isModalOpen}
           onClose={handleCloseModal}
           onSubmit={handleEventSubmit}
           position={temporaryMarkerPosition}
           eventDetails={newEventDetails}
           setEventDetails={setNewEventDetails}
           isSubmitting={isSubmittingEvent}
       />
   </div>);
}
export default App;