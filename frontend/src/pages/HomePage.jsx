import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChefHat, 
  Clock, 
  MapPin, 
  Phone, 
  Star, 
  Users, 
  Calendar,
  Utensils,
  Heart,
  Award
} from 'lucide-react';

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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  const heroVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 1, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Navigation */}
      <motion.nav 
        className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ChefHat className="w-8 h-8 text-amber-600" />
              <span className="text-xl font-bold text-gray-900">Culture Colombo</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/menu" className="text-gray-700 hover:text-amber-600 transition-colors">Menu</Link>
              <Link to="/book-table" className="text-gray-700 hover:text-amber-600 transition-colors">Reservations</Link>
              <Link to="/login" className="text-gray-700 hover:text-amber-600 transition-colors">Login</Link>
              <Link
                to="/book-table"
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                Book Table
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        className="relative py-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden"
        variants={heroVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Authentic
            <span className="block text-amber-600">Sri Lankan</span>
            <span className="block text-4xl md:text-5xl">Cuisine</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Experience the rich flavors and traditional spices of Sri Lanka in the heart of Colombo. 
            Where heritage meets culinary excellence.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link
              to="/menu"
              className="inline-flex items-center px-8 py-4 bg-amber-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-amber-700 transform hover:scale-105 transition-all duration-300"
            >
              <Utensils className="w-5 h-5 mr-2" />
              Explore Menu
            </Link>
            <Link
              to="/book-table"
              className="inline-flex items-center px-8 py-4 bg-white text-amber-600 text-lg font-semibold rounded-xl shadow-lg border-2 border-amber-600 hover:bg-amber-50 transform hover:scale-105 transition-all duration-300"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Reserve Table
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">25+</div>
              <div className="text-sm text-gray-600">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">50+</div>
              <div className="text-sm text-gray-600">Signature Dishes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">4.8</div>
              <div className="text-sm text-gray-600">Customer Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">1000+</div>
              <div className="text-sm text-gray-600">Happy Customers</div>
            </div>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-20 left-10 text-amber-200/30"
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <ChefHat size={60} />
          </motion.div>
          <motion.div 
            className="absolute bottom-40 right-20 text-orange-200/30"
            animate={{ 
              rotate: -360,
              y: [0, -20, 0]
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Utensils size={40} />
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Culture Colombo?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We bring you the finest Sri Lankan dining experience with authentic flavors, 
              warm hospitality, and a commitment to culinary excellence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              className="bg-white rounded-2xl p-8 shadow-xl text-center hover:shadow-2xl transition-shadow duration-300"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Authentic Recipes</h3>
              <p className="text-gray-600">
                Traditional family recipes passed down through generations, 
                prepared with authentic spices and cooking methods.
              </p>
            </motion.div>

            <motion.div 
              className="bg-white rounded-2xl p-8 shadow-xl text-center hover:shadow-2xl transition-shadow duration-300"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fresh Ingredients</h3>
              <p className="text-gray-600">
                Locally sourced, fresh ingredients and spices imported directly 
                from Sri Lanka to ensure authentic taste and quality.
              </p>
            </motion.div>

            <motion.div 
              className="bg-white rounded-2xl p-8 shadow-xl text-center hover:shadow-2xl transition-shadow duration-300"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Warm Hospitality</h3>
              <p className="text-gray-600">
                Experience true Sri Lankan hospitality with our friendly service 
                and welcoming atmosphere that makes you feel at home.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Location & Hours */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div variants={itemVariants}>
              <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <MapPin className="w-6 h-6 mr-3 text-amber-600" />
                Visit Us
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-amber-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Culture Colombo Restaurant</p>
                    <p className="text-gray-600">123 Galle Road, Colombo 03, Sri Lanka</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-gray-600">+94 77 123 4567</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-3 text-amber-600" />
                Opening Hours
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Thursday</span>
                  <span className="font-medium text-gray-900">11:30 AM - 10:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Friday - Sunday</span>
                  <span className="font-medium text-gray-900">11:30 AM - 11:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lunch Service</span>
                  <span className="font-medium text-gray-900">11:30 AM - 3:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dinner Service</span>
                  <span className="font-medium text-gray-900">6:30 PM - 10:00 PM</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Taste Sri Lanka?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Book your table now and embark on a culinary journey through the flavors of Sri Lanka.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/menu"
              className="inline-flex items-center px-8 py-4 bg-amber-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-amber-700 transform hover:scale-105 transition-all duration-300"
            >
              <Utensils className="w-5 h-5 mr-2" />
              View Full Menu
            </Link>
            <Link
              to="/book-table"
              className="inline-flex items-center px-8 py-4 bg-white text-amber-600 text-lg font-semibold rounded-xl shadow-lg border-2 border-amber-600 hover:bg-amber-50 transform hover:scale-105 transition-all duration-300"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Make Reservation
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ChefHat className="w-8 h-8 text-amber-600" />
                <span className="text-xl font-bold">Culture Colombo</span>
              </div>
              <p className="text-gray-400">
                Authentic Sri Lankan cuisine served with traditional hospitality 
                in the heart of Colombo.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link to="/menu" className="block text-gray-400 hover:text-amber-400 transition-colors">Menu</Link>
                <Link to="/book-table" className="block text-gray-400 hover:text-amber-400 transition-colors">Reservations</Link>
                <Link to="/login" className="block text-gray-400 hover:text-amber-400 transition-colors">Login</Link>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-400">
                <p>123 Galle Road, Colombo 03</p>
                <p>+94 77 123 4567</p>
                <p>info@culturecolombo.com</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Culture Colombo Restaurant. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
