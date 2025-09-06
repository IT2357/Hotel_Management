import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, Star, Clock, Users, ShoppingCart, Heart, Calendar } from 'lucide-react';

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const features = [
    {
      icon: ChefHat,
      title: "Authentic Cuisine",
      description: "Discover exotic flavors and traditional recipes"
    },
    {
      icon: Star,
      title: "Premium Quality",
      description: "Fresh ingredients, expertly prepared dishes"
    },
    {
      icon: Clock,
      title: "Quick Service",
      description: "Fast delivery and efficient order processing"
    },
    {
      icon: Users,
      title: "Table Booking",
      description: "Reserve your perfect dining experience"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Hero Section */}
      <motion.div 
        className="container mx-auto px-4 py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            variants={itemVariants}
            className="mb-6"
          >
            <span className="text-6xl mb-4 block">🍽️</span>
            <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-orange-600 via-red-600 to-yellow-600 bg-clip-text text-transparent mb-4">
              Culture Colombo
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 font-medium">
              Restaurant & Food Management
            </p>
          </motion.div>

          <motion.p 
            variants={itemVariants}
            className="text-gray-600 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Experience the authentic taste of Sri Lankan cuisine with our carefully crafted menu. 
            From traditional hoppers to modern fusion dishes, discover flavors that tell a story.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
          >
            <Link
              to="/menu"
              className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium text-lg flex items-center justify-center gap-2"
            >
              <ShoppingCart size={20} />
              Browse Menu
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>
            <Link
              to="/booking"
              className="group px-8 py-4 bg-white text-orange-600 border-2 border-orange-500 rounded-full shadow-lg hover:bg-orange-50 transition-all duration-300 font-medium text-lg flex items-center justify-center gap-2"
            >
              <Calendar size={20} />
              Book Table
            </Link>
            <Link
              to="/favorites"
              className="group px-8 py-4 bg-yellow-500 text-white rounded-full shadow-lg hover:bg-yellow-600 transition-all duration-300 font-medium text-lg flex items-center justify-center gap-2"
            >
              <Heart size={20} />
              My Favorites
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-100"
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
              >
                <feature.icon className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Call to Action */}
          <motion.div 
            variants={itemVariants}
            className="bg-white p-8 rounded-3xl shadow-xl border border-orange-200"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              Ready to Start Your Culinary Journey?
            </h2>
            <p className="text-gray-600 mb-6">
              Join our community of food lovers and experience the best of Sri Lankan cuisine
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/login"
                className="px-8 py-3 bg-orange-500 text-white rounded-full shadow hover:bg-orange-600 transition duration-300 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-8 py-3 bg-transparent text-orange-600 border-2 border-orange-500 rounded-full shadow hover:bg-orange-50 transition duration-300 font-medium"
              >
                Create Account
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Background Animation */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-200 rounded-full opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-red-200 rounded-full opacity-20"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
    </div>
  );
}
