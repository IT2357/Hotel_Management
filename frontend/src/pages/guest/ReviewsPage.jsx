import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function ReviewsPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  useEffect(() => setIsVisible(true), []);

  const submitDisabled = review.trim().length < 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-600">Reviews & Ratings</h1>
          <p className="mt-3 text-gray-700 text-lg">Share your VALDOR dining experience. Detailed moderation and order-linked feedback are handled server-side.</p>
        </div>

        <div className="mt-8 rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800">Leave a Review</h2>
          <div className="mt-4 grid gap-4">
            <label className="block">
              <span className="text-gray-700 font-medium">Overall Rating</span>
              <div className="mt-2 flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setRating(n)} className={`w-10 h-10 rounded-full border flex items-center justify-center ${n <= rating ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{n}</button>
                ))}
              </div>
            </label>
            <label className="block">
              <span className="text-gray-700 font-medium">Comments</span>
              <textarea rows={5} value={review} onChange={e => setReview(e.target.value)} className="mt-2 w-full border rounded-lg px-4 py-3" placeholder="Tell us about the food, service, and ambiance..." />
            </label>
            <div className="flex items-center gap-3">
              <button disabled={submitDisabled} className={`px-6 py-3 rounded-full font-semibold transition-colors ${submitDisabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700'}`}>Submit Feedback</button>
              <span className="text-sm text-gray-500">This is a UI placeholder; API wiring will attach to order and dish items.</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-3">
          <Link to="/dashboard" className="px-6 py-3 rounded-full bg-white border text-gray-800 hover:bg-gray-100">Back to Dashboard</Link>
          <Link to="/menu" className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 text-white">Explore Menu</Link>
        </div>
      </div>
    </div>
  );
}