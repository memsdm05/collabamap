import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Save, 
  Calendar, 
  Music, 
  Utensils, 
  Dumbbell, 
  Plus, 
  Trash, 
  List, 
  Map as MapIcon, 
  ChevronLeft, 
  X,
  Search
} from 'lucide-react';

// Import Leaflet CSS directly from CDN to ensure it loads
import 'leaflet/dist/leaflet.css';
import './EventMap.css';

// Fix for default marker icons in react-leaflet
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = defaultIcon;

// Custom icons for different event categories
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const categoryIcons = {
  music: createCustomIcon('#4f46e5'),  // indigo
  sports: createCustomIcon('#10b981'), // emerald
  food: createCustomIcon('#ef4444'),   // red
  other: createCustomIcon('#8b5cf6'),  // purple
};

// Categories with friendlier display names
const categories = [
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'other', label: 'Other' }
];

// Map click handler component
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e);
    },
  });
  return null;
}

export const EventMap = () => {
  const [events, setEvents] = useState([]);
  const [newMarker, setNewMarker] = useState(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCategory, setEventCategory] = useState('other');
  const [showForm, setShowForm] = useState(false);
  const [showEventsList, setShowEventsList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('map'); // 'map' or 'list'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventImages, setSelectedEventImages] = useState([]);
  const mapRef = useRef(null);

  // Load nearby events when the component mounts
  useEffect(() => {
    fetchNearbyEvents();
  }, []);

  // Function to fetch nearby events from the API
  const fetchNearbyEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // ====== API CALL: FETCH NEARBY EVENTS ======
      // Replace this with your actual API call
      // const response = await fetch('https://your-api.com/events/nearby', {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to fetch nearby events');
      // }
      // 
      // const data = await response.json();
      // setEvents(data);
      // ====== END API CALL ======

      // Placeholder for testing (remove this when you implement the API)
      setTimeout(() => {
        setEvents([
          {
            id: 1,
            title: "Jazz Festival",
            description: "Annual jazz festival with local artists performing live across multiple venues. Don't miss the special midnight jam session!",
            category: "music",
            position: { lat: 40.7128, lng: -74.01 }
          },
          {
            id: 2,
            title: "Food Truck Rally",
            description: "Weekly gathering of the best food trucks in the city. Various cuisines from around the world and craft beverages available.",
            category: "food",
            position: { lat: 40.7148, lng: -74.006 }
          },
          {
            id: 3,
            title: "Central Park Run",
            description: "Join fellow runners for a 5K run through scenic paths. All experience levels welcome!",
            category: "sports",
            position: { lat: 40.7135, lng: -73.998 }
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Function to save an event to the API
  const saveEventToAPI = async (eventData) => {
    try {
      // ====== API CALL: SAVE NEW EVENT ======
      // Replace this with your actual API call
      // const response = await fetch('https://your-api.com/events', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(eventData)
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to save event');
      // }
      // 
      // const savedEvent = await response.json();
      // return savedEvent;
      // ====== END API CALL ======
      
      // Placeholder for testing (remove this when you implement the API)
      // Simulating a response with a new ID
      return { ...eventData, id: Date.now() };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Function to delete an event from the API
  const deleteEventFromAPI = async (eventId) => {
    try {
      // ====== API CALL: DELETE EVENT ======
      // Replace this with your actual API call
      // const response = await fetch(`https://your-api.com/events/${eventId}`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   }
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to delete event');
      // }
      // ====== END API CALL ======
      
      // Placeholder for testing (remove this when you implement the API)
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Function to fetch event images from the API
  const fetchEventImages = async (eventId) => {
    try {
      // ====== API CALL: FETCH EVENT IMAGES ======
      // Replace this with your actual API call
      // const response = await fetch(`https://your-api.com/events/${eventId}/images`, {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   }
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to fetch event images');
      // }
      //
      // const data = await response.json();
      // return data.images;
      // ====== END API CALL ======
      
      // Placeholder for testing (remove when implementing the API)
      const placeholderImages = [
        'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6a3?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'
      ];
      
      // Return different images based on category for demo purposes
      if (eventId === 1) {
        return placeholderImages.slice(0, 4); // Music event - all images
      } else if (eventId === 2) {
        return placeholderImages.slice(1, 3); // Food event - 2 images
      } else if (eventId === 3) {
        return placeholderImages.slice(2, 4); // Sports event - 2 images
      }
      
      return placeholderImages.slice(0, 2); // Default - 2 images
    } catch (err) {
      console.error('Error fetching event images:', err);
      return [];
    }
  };

  const handleMapClick = (event) => {
    if (activeView !== 'map') return;
    
    const { lat, lng } = event.latlng;
    setNewMarker({ lat, lng });
    setShowForm(true);
  };

  const saveEvent = async () => {
    if (newMarker && eventTitle.trim()) {
      try {
        const newEvent = {
          title: eventTitle,
          description: eventDescription,
          category: eventCategory,
          position: newMarker,
        };

        // Save to API and get the saved event with ID
        const savedEvent = await saveEventToAPI(newEvent);
        
        // Update local state with the new event
        setEvents([...events, savedEvent]);
        resetForm();
        
        // Fly to the new event location
        if (mapRef.current) {
          mapRef.current.flyTo([newMarker.lat, newMarker.lng], 14);
        }
      } catch (err) {
        // Error is already set in saveEventToAPI
        console.error('Failed to save event:', err);
      }
    }
  };

  const deleteEvent = async (id, e) => {
    e.stopPropagation();
    
    try {
      await deleteEventFromAPI(id);
      setEvents(events.filter(event => event.id !== id));
      
      // If currently viewing the deleted event, close the detail view
      if (selectedEvent && selectedEvent.id === id) {
        setSelectedEvent(null);
      }
    } catch (err) {
      // Error is already set in deleteEventFromAPI
      console.error('Failed to delete event:', err);
    }
  };

  const resetForm = () => {
    setNewMarker(null);
    setEventTitle('');
    setEventDescription('');
    setEventCategory('other');
    setShowForm(false);
  };

  const flyToLocation = (position) => {
    if (mapRef.current) {
      mapRef.current.flyTo([position.lat, position.lng], 14);
    }
    
    // Switch to map view if not already there
    setActiveView('map');
    setShowEventsList(false);
  };

  const handleEventClick = async (event) => {
    setSelectedEvent(event);
    
    // Fetch images for the selected event
    const images = await fetchEventImages(event.id);
    setSelectedEventImages(images);
    
    // Fly to event location if in map view
    if (activeView === 'map') {
      flyToLocation(event.position);
    }
  };

  const closeEventDetail = () => {
    setSelectedEvent(null);
    setSelectedEventImages([]);
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'music': return <Music size={16} />;
      case 'sports': return <Dumbbell size={16} />;
      case 'food': return <Utensils size={16} />;
      default: return <MapPin size={16} />;
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'music': return '#4f46e5';
      case 'sports': return '#10b981';
      case 'food': return '#ef4444';
      default: return '#8b5cf6';
    }
  };

  const toggleView = (view) => {
    setActiveView(view);
    
    if (view === 'list') {
      setShowEventsList(true);
    } else {
      setShowEventsList(false);
    }
  };

  // Render loading skeleton for event list
  const renderEventSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <div className="skeleton-card" key={`skeleton-${index}`}>
        <div className="skeleton-circle"></div>
        <div className="skeleton-content">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
        </div>
      </div>
    ));
  };
  
  return (
    <div className="map-container">
      {/* Header Banner */}
      <div className="header-banner">
        <div>
          <span style={{ fontSize: '1rem', fontWeight: '600' }}>Event Map</span>
        </div>
        <div>
          <Calendar size={20} style={{ color: '#4f46e5' }} />
        </div>
      </div>

      {/* Map Area */}
      <div className="map-area">
        {loading && activeView === 'map' ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
            backgroundColor: '#121212'
          }}>
            <div>Loading map...</div>
          </div>
        ) : (
          <MapContainer
            center={[40.7128, -74.006]} // Default to New York
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Map click handler */}
            <MapClickHandler onMapClick={handleMapClick} />
            
            {/* Render existing event markers */}
            {events.map(event => (
              <Marker
                key={event.id}
                position={[event.position.lat, event.position.lng]}
                icon={categoryIcons[event.category || 'other']}
                eventHandlers={{
                  click: () => handleEventClick(event)
                }}
              >
                <Popup>
                  <div>
                    <h3 style={{ fontWeight: 600, margin: '0 0 8px 0' }}>{event.title}</h3>
                    <p style={{ fontSize: '0.875rem', margin: '0 0 8px 0' }}>{event.description}</p>
                    <p style={{ fontSize: '0.75rem', color: '#a0a0a0', margin: 0 }}>
                      {event.position.lat.toFixed(4)}, {event.position.lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {/* Render temporary new marker */}
            {newMarker && (
              <Marker
                position={[newMarker.lat, newMarker.lng]}
                icon={L.divIcon({
                  className: 'pulse-marker',
                  html: '<div class="pulse-dot"></div>',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                })}
              />
            )}
          </MapContainer>
        )}
      </div>
      
      {/* Error message if any */}
      {error && (
        <div style={{ 
          position: 'absolute',
          top: '60px',
          left: 0,
          right: 0,
          padding: '0.5rem 1rem', 
          backgroundColor: 'rgba(239, 68, 68, 0.9)', 
          color: 'white',
          zIndex: 15
        }}>
          Error: {error}
        </div>
      )}
      
      {/* Floating Add Button */}
      <button className="add-button" onClick={() => setShowForm(true)}>
        <Plus size={24} />
      </button>
      
      {/* Bottom Navigation Bar */}
      <div className="bottom-bar">
        <button 
          className={`bottom-bar-button ${activeView === 'map' ? 'active' : ''}`}
          onClick={() => toggleView('map')}
        >
          <MapIcon size={20} className="bottom-bar-button-icon" />
          <span>Map</span>
        </button>
        <button 
          className={`bottom-bar-button ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => toggleView('list')}
        >
          <List size={20} className="bottom-bar-button-icon" />
          <span>Events</span>
        </button>
        <button className="bottom-bar-button">
          <Search size={20} className="bottom-bar-button-icon" />
          <span>Search</span>
        </button>
      </div>
      
      {/* Events List Panel */}
      <div className={`events-panel ${showEventsList ? 'active' : ''}`}>
        <div className="panel-handle" />
        <div className="events-panel-header">
          <h2 style={{ margin: 0 }}>Nearby Events</h2>
        </div>
        <div className="events-list">
          {loading ? renderEventSkeletons() : (
            events.length === 0 ? (
              <p>No events found nearby. Click on the map to add a new event.</p>
            ) : (
              events.map(event => (
                <div 
                  key={event.id} 
                  className="event-card" 
                  onClick={() => handleEventClick(event)}
                >
                  <div className="card-category-icon" style={{ color: getCategoryColor(event.category) }}>
                    {getCategoryIcon(event.category)}
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{event.title}</h3>
                    <p className="card-description">{event.description}</p>
                    <div className="card-location">
                      <MapPin size={14} />
                      <span>{event.position.lat.toFixed(4)}, {event.position.lng.toFixed(4)}</span>
                    </div>
                  </div>
                  <button 
                    className="card-delete" 
                    onClick={(e) => deleteEvent(event.id, e)}
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>
      
      {/* Event Form Modal */}
      {showForm && (
        <div className="form-container">
          <div className="event-form">
            <h2 className="form-title">Add New Event</h2>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="form-input"
                placeholder="Concert, Game, Meetup..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="form-textarea"
                placeholder="Add details about this event..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value)}
                className="form-select"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={saveEvent}>
                <Save size={16} /> Save Event
              </button>
              <button className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="event-detail-modal">
          <div className="modal-header">
            <button className="back-button" onClick={closeEventDetail}>
              <ChevronLeft size={24} />
            </button>
            <h2 className="modal-title">{selectedEvent.title}</h2>
          </div>
          <div className="modal-body">
            {selectedEventImages.length > 0 && (
              <div className="detail-images">
                <div className="image-gallery">
                  {selectedEventImages.map((src, index) => (
                    <img
                      key={index}
                      src={src}
                      alt={`${selectedEvent.title} - image ${index + 1}`}
                      className="gallery-image"
                    />
                  ))}
                </div>
                {selectedEventImages.length > 1 && (
                  <div className="image-counter">
                    {selectedEventImages.length} photos
                  </div>
                )}
              </div>
            )}
            
            <div className="detail-info">
              <div className="detail-category" style={{ color: getCategoryColor(selectedEvent.category) }}>
                {getCategoryIcon(selectedEvent.category)}
                <span>{categories.find(c => c.value === selectedEvent.category)?.label || 'Other'}</span>
              </div>
              <p className="detail-description">{selectedEvent.description}</p>
            </div>
            
            <div className="detail-location">
              <div className="location-icon">
                <MapPin size={20} />
              </div>
              <div className="location-text">
                {selectedEvent.position.lat.toFixed(4)}, {selectedEvent.position.lng.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Both named and default export for flexibility
export default EventMap;