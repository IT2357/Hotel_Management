import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SharedNavbar from '../components/shared/SharedNavbar';

export default function Gallery() {
  const navigate = useNavigate();

  const galleryImages = [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      title: 'Luxury Suite',
      category: 'Rooms'
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      title: 'Jaffna Cuisine',
      category: 'Food'
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      title: 'Hotel Exterior',
      category: 'Hotel'
    },
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800',
      title: 'Deluxe Room',
      category: 'Rooms'
    },
    {
      id: 5,
      url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      title: 'Seafood Platter',
      category: 'Food'
    },
    {
      id: 6,
      url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
      title: 'Hotel Lobby',
      category: 'Hotel'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* ✅ Shared Navigation */}
      <SharedNavbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-16 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Gallery</h1>
            <p className="text-xl text-white/90">Explore our beautiful hotel and cuisine</p>
          </motion.div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="aspect-w-16 aspect-h-12">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm mb-2">
                    {image.category}
                  </div>
                  <h3 className="text-xl font-bold">{image.title}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center text-white"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Experience This?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Book your stay with us today and create unforgettable memories
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/rooms')}
              className="px-8 py-4 bg-white text-indigo-600 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg"
            >
              Browse Rooms
            </button>
            <button
              onClick={() => navigate('/food-ordering')}
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold text-lg hover:bg-white hover:text-indigo-600 transition-all duration-300"
            >
              Order Food
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
