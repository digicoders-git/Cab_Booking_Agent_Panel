// src/components/LiveLocationMonitor.jsx
import { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { Activity, Wifi, WifiOff } from 'lucide-react';

export default function LiveLocationMonitor() {
  const [updates, setUpdates] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [isReceiving, setIsReceiving] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleLocationUpdate = (event) => {
      const data = event.detail;
      const timestamp = new Date().toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      console.log('🎯 LiveLocationMonitor: Location Update Captured!', {
        timestamp,
        driverId: data.driverId,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading
      });

      // Add to updates list (keep last 20)
      setUpdates(prev => {
        const newUpdate = {
          id: Date.now(),
          timestamp,
          driverId: data.driverId,
          lat: data.latitude,
          lng: data.longitude,
          heading: data.heading,
          speed: data.speed
        };
        return [newUpdate, ...prev].slice(0, 20);
      });

      setLastUpdateTime(Date.now());
      setUpdateCount(prev => prev + 1);
      setIsReceiving(true);

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout to mark as not receiving after 10 seconds
      timeoutRef.current = setTimeout(() => {
        setIsReceiving(false);
      }, 10000);
    };

    window.addEventListener('driver_location_update', handleLocationUpdate);

    return () => {
      window.removeEventListener('driver_location_update', handleLocationUpdate);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Calculate time since last update
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(null);
  useEffect(() => {
    if (!lastUpdateTime) return;

    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - lastUpdateTime) / 1000);
      setTimeSinceUpdate(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  return (
    <>
      {/* Floating Monitor Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`relative px-4 py-3 rounded-full shadow-lg transition-all flex items-center gap-2 font-medium text-sm ${
            isReceiving 
              ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse' 
              : 'bg-gray-800 hover:bg-gray-900 text-white'
          }`}
        >
          {isReceiving ? (
            <Wifi size={18} className="animate-bounce" />
          ) : (
            <WifiOff size={18} />
          )}
          <span className="hidden sm:inline">
            {isReceiving ? 'Live Updates' : 'No Updates'}
          </span>
          {updateCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {updateCount > 99 ? '99+' : updateCount}
            </span>
          )}
        </button>
      </div>

      {/* Expanded Monitor Panel */}
      {isExpanded && (
        <div className="fixed bottom-20 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[70vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity size={20} />
                <h3 className="font-bold text-lg">Live Location Monitor</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-all"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <FaCheckCircle size={12} />
                <span>Total: {updateCount}</span>
              </div>
              {lastUpdateTime && (
                <div className="flex items-center gap-1">
                  <FaClock size={12} />
                  <span>
                    {timeSinceUpdate < 60 
                      ? `${timeSinceUpdate}s ago` 
                      : `${Math.floor(timeSinceUpdate / 60)}m ago`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Indicator */}
          <div className={`p-3 border-b ${isReceiving ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2">
              {isReceiving ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">
                    ✅ Receiving Live Updates
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-700">
                    ⚠️ No Updates (Waiting for driver movement...)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Updates List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {updates.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FaMapMarkerAlt size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No location updates yet</p>
                <p className="text-xs mt-1">Waiting for driver to move...</p>
              </div>
            ) : (
              updates.map((update, index) => (
                <div
                  key={update.id}
                  className={`p-3 rounded-lg border transition-all ${
                    index === 0 
                      ? 'bg-green-50 border-green-200 shadow-md' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt 
                        size={14} 
                        className={index === 0 ? 'text-green-600' : 'text-gray-600'} 
                      />
                      <span className="text-xs font-semibold text-gray-700">
                        Update #{updates.length - index}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{update.timestamp}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Driver ID:</span>
                      <p className="font-mono font-medium text-gray-800 truncate">
                        {update.driverId?.slice(-8) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Heading:</span>
                      <p className="font-medium text-gray-800">
                        {update.heading ? `${update.heading}°` : 'N/A'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Coordinates:</span>
                      <p className="font-mono text-xs text-gray-800 break-all">
                        {update.lat?.toFixed(6)}, {update.lng?.toFixed(6)}
                      </p>
                    </div>
                  </div>
                  {index === 0 && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <span className="text-xs text-green-600 font-medium">
                        🔴 Latest Update
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Updates refresh automatically</span>
              <button
                onClick={() => {
                  setUpdates([]);
                  setUpdateCount(0);
                  setLastUpdateTime(null);
                }}
                className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-all font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
