import React, { useState, useEffect } from 'react';

export default function ContactTest() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    console.log('📦 Raw user data from localStorage:', userData);
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('✅ Parsed user:', parsedUser);
        console.log('👤 User role:', parsedUser.role);
        setUser(parsedUser);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
      }
    } else {
      console.log('⚠️ No user data found in localStorage');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Contact Page Debug Info</h1>
        
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h2 className="font-semibold text-lg mb-2">User Status:</h2>
            {user ? (
              <div className="bg-green-50 p-4 rounded">
                <p className="text-green-800">✅ User is logged in</p>
                <div className="mt-2 space-y-1">
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> <span className="font-bold text-blue-600">{user.role}</span></p>
                  <p><strong>ID:</strong> {user._id}</p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded">
                <p className="text-red-800">❌ No user logged in</p>
                <p className="text-sm mt-2">You need to login first to see the chat.</p>
              </div>
            )}
          </div>

          <div className="border-b pb-4">
            <h2 className="font-semibold text-lg mb-2">Expected Behavior:</h2>
            <div className="bg-blue-50 p-4 rounded space-y-2">
              {user && (user.role === 'staff' || user.role === 'chef' || user.role === 'kitchen') ? (
                <p className="text-green-600 font-semibold">
                  ✅ You should see the WhatsApp-style chat!
                </p>
              ) : user ? (
                <p className="text-orange-600 font-semibold">
                  ⚠️ Your role is "{user.role}" - Chat only shows for: staff, chef, or kitchen
                </p>
              ) : (
                <p className="text-red-600 font-semibold">
                  ❌ Please login as a staff member to see the chat
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-lg mb-2">What to do:</h2>
            <div className="bg-yellow-50 p-4 rounded">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>If not logged in: <strong>Login as a staff member</strong></li>
                <li>If logged in with wrong role: <strong>Logout and login as staff</strong></li>
                <li>If correct role: <strong>Hard refresh the page (Ctrl+Shift+R)</strong></li>
                <li>Check browser console for errors (F12)</li>
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
