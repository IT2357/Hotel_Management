// Placeholder for import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Star, Award, Users, MapPin, Phone, Mail, Clock, Shield, Heart } from 'lucide-react';

export default function About() {
  const features = [
    {
      icon: Shield,
      title: "Premium Security",
      description: "24/7 security and surveillance for your peace of mind"
    },
    {
      icon: Heart,
      title: "Exceptional Service",
      description: "Personalized service from our dedicated staff"
    },
    {
      icon: Award,
      title: "Award Winning",
      description: "Recognized for excellence in hospitality"
    },
    {
      icon: Users,
      title: "Family Friendly",
      description: "Perfect for families and business travelers alike"
    }
  ];

  const amenities = [
    "Free Wi-Fi throughout the property",
    "24-hour room service",
    "Fitness center with modern equipment",
    "Business center with meeting rooms",
    "Concierge services",
    "Valet parking",
    "Laundry and dry cleaning",
    "Airport shuttle service",
    "Spa and wellness center",
    "Multiple dining options"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-indigo-800 mb-6">
            About Grand Hotel
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Experience luxury and comfort at Grand Hotel, where every guest is treated
            like royalty. Our commitment to excellence has made us the premier destination
            for discerning travelers for over two decades.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Story Section */}
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Our Story
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Founded in 2002, Grand Hotel has been synonymous with luxury hospitality
                and exceptional service. What started as a vision to create the perfect
                blend of traditional elegance and modern comfort has evolved into a
                world-class destination.
              </p>
              <p>
                Located in the heart of the city, our hotel offers breathtaking views,
                world-class amenities, and personalized service that anticipates every
                guest's needs. From business travelers seeking productivity to families
                creating lasting memories, we cater to every type of traveler.
              </p>
              <p>
                Our commitment to sustainability, community involvement, and continuous
                improvement ensures that we remain at the forefront of the hospitality
                industry while maintaining the personal touch that makes every stay special.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Why Choose Us
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition duration-300">
                  <div className="flex items-center mb-3">
                    <feature.icon className="h-8 w-8 text-indigo-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Amenities Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
            Hotel Amenities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {amenities.map((amenity, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <span className="text-gray-700">{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">500+</div>
            <div className="text-gray-600">Rooms</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">20+</div>
            <div className="text-gray-600">Years</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">50k+</div>
            <div className="text-gray-600">Happy Guests</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">4.8</div>
            <div className="text-gray-600">Rating</div>
          </Card>
        </div>

        {/* Contact CTA */}
        <div className="text-center">
          <Card className="p-8 bg-indigo-600 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Experience Grand Hotel?
            </h2>
            <p className="text-indigo-100 mb-6 text-lg">
              Book your stay today and discover why our guests return time and time again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="bg-white text-indigo-600 hover:bg-indigo-50"
                onClick={() => window.location.href = '/booking'}
              >
                Book Now
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-indigo-600"
                onClick={() => window.location.href = '/contact'}
              >
                Contact Us
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}