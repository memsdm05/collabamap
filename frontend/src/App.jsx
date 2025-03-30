import { useState, useMemo } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps'

function App() {
  const [count, setCount] = useState(0)
  const [markers, setMarkers] = useState([
    { id: 1, position: { lat: 40.7128, lng: -74.0060 }, title: "New York" },
    { id: 2, position: { lat: 34.0522, lng: -118.2437 }, title: "Los Angeles" },
    { id: 3, position: { lat: 41.8781, lng: -87.6298 }, title: "Chicago" }
  ])
  const [selectedMarker, setSelectedMarker] = useState(null)

  // Default center position (US)
  const center = useMemo(() => ({
    lat: 39.8283,
    lng: -98.5795,
  }), [])

  // Function to add a new random marker
  const addRandomMarker = () => {
    // Random location within the continental US
    const lat = Math.random() * (49.3457868 - 24.7433195) + 24.7433195
    const lng = Math.random() * (-66.9513812 - (-124.7844079)) + (-124.7844079)
    
    const newMarker = {
      id: Date.now(), // Using timestamp as id to ensure uniqueness
      position: { lat, lng },
      title: `Marker #${markers.length + 1}`
    }
    
    setMarkers([...markers, newMarker])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center p-4 text-white">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center">Google Maps in React</h1>
        <p className="text-xl opacity-80 mt-2 text-center">Using @vis.gl/react-google-maps</p>
      </header>

      <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-5xl w-full">
        <div className="flex flex-col">
          {/* Google Map Component */}
          <div className="w-full h-96 rounded-lg overflow-hidden mb-6">
            <APIProvider apiKey="AIzaSyCroenb3Of29AQwc1_zMFMLoMa52fxiUjw">
              <Map
                defaultCenter={center}
                defaultZoom={4}
                mapId="YOUR_MAP_ID" // Optional: for styled maps
                gestureHandling="cooperative"
                onClick={() => setSelectedMarker(null)}
              >
                {/* Render all markers using AdvancedMarker */}
                {markers.map(marker => (
                  <AdvancedMarker
                    key={marker.id}
                    position={marker.position}
                    title={marker.title}
                    onClick={() => setSelectedMarker(marker)}
                  >
                    <Pin
                      background={"#4285F4"}
                      glyphColor={"#FFF"}
                      borderColor={"#FFF"}
                    />
                  </AdvancedMarker>
                ))}

                {/* Info Window for selected marker */}
                {selectedMarker && (
                  <InfoWindow
                    position={selectedMarker.position}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="text-black p-2">
                      <h3 className="font-bold text-lg">{selectedMarker.title}</h3>
                      <p>Lat: {selectedMarker.position.lat.toFixed(4)}</p>
                      <p>Lng: {selectedMarker.position.lng.toFixed(4)}</p>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCount((count) => count + 1)}
              className="px-6 py-3 bg-white text-purple-700 rounded-lg font-semibold shadow-md hover:bg-purple-100 transition-colors"
            >
              Count is {count}
            </button>
            
            <button
              onClick={addRandomMarker}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold shadow-md hover:bg-green-600 transition-colors"
            >
              Add Random Marker
            </button>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Current Markers:</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {markers.map((marker) => (
                <div 
                  key={marker.id} 
                  className="bg-white/20 p-3 rounded-lg cursor-pointer hover:bg-white/30"
                  onClick={() => setSelectedMarker(marker)}
                >
                  <p><strong>{marker.title}</strong></p>
                  <p className="text-sm">Lat: {marker.position.lat.toFixed(4)}</p>
                  <p className="text-sm">Lng: {marker.position.lng.toFixed(4)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/20 text-center">
          <p className="text-sm opacity-70">
            Click on the markers or list items to see more information
          </p>
        </div>
      </div>
    </div>
  )
}

export default App