// 📁 frontend/src/components/common/SearchResults.jsx
import { Link } from 'react-router-dom';
import { Loader } from 'lucide-react';

const SearchResults = ({ results, loading, error, onResultClick, maxHeight = 'max-h-96' }) => {
  if (loading) {
    return (
      <div className={`absolute top-16 left-4 right-4 ${maxHeight} bg-white shadow-2xl rounded-xl border border-gray-200 p-4 overflow-y-auto`}>
        <div className="flex items-center justify-center py-8">
          <Loader className="w-5 h-5 animate-spin text-indigo-600 mr-2" />
          <span className="text-gray-600">Searching...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`absolute top-16 left-4 right-4 ${maxHeight} bg-white shadow-2xl rounded-xl border border-gray-200 p-4`}>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  // Group results by type
  const groupedResults = {
    user: results.filter(r => r.type === 'user'),
    booking: results.filter(r => r.type === 'booking'),
    room: results.filter(r => r.type === 'room')
  };

  return (
    <div className={`absolute top-16 left-4 right-4 ${maxHeight} bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden z-50`}>
      <div className="divide-y divide-gray-100 overflow-y-auto">
        {/* Users Section */}
        {groupedResults.user.length > 0 && (
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Users</div>
            {groupedResults.user.map(result => (
              <Link
                key={`${result.type}-${result.id}`}
                to={result.link}
                onClick={onResultClick}
                className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors duration-150"
              >
                <span className="text-lg">{result.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{result.title}</div>
                  <div className="text-sm text-gray-500 truncate">{result.subtitle}</div>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">User</span>
              </Link>
            ))}
          </div>
        )}

        {/* Bookings Section */}
        {groupedResults.booking.length > 0 && (
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bookings</div>
            {groupedResults.booking.map(result => (
              <Link
                key={`${result.type}-${result.id}`}
                to={result.link}
                onClick={onResultClick}
                className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors duration-150"
              >
                <span className="text-lg">{result.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{result.title}</div>
                  <div className="text-sm text-gray-500 truncate">{result.subtitle}</div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Booking</span>
              </Link>
            ))}
          </div>
        )}

        {/* Rooms Section */}
        {groupedResults.room.length > 0 && (
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rooms</div>
            {groupedResults.room.map(result => (
              <Link
                key={`${result.type}-${result.id}`}
                to={result.link}
                onClick={onResultClick}
                className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors duration-150"
              >
                <span className="text-lg">{result.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{result.title}</div>
                  <div className="text-sm text-gray-500 truncate">{result.subtitle}</div>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Room</span>
              </Link>
            ))}
          </div>
        )}

        {/* No Results */}
        {results.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <div className="text-lg mb-2">🔍</div>
            <p>No results found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
