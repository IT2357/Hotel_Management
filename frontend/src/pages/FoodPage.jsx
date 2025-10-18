import React, { useState } from 'react';
import Card from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Clock, Star, Users, ChefHat, Utensils, Coffee, Wine } from 'lucide-react';

export default function FoodPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All', icon: Utensils },
    { id: 'breakfast', name: 'Breakfast', icon: Coffee },
    { id: 'lunch', name: 'Lunch', icon: Utensils },
    { id: 'dinner', name: 'Dinner', icon: Utensils },
    { id: 'drinks', name: 'Drinks', icon: Wine }
  ];

  const menuItems = [
    {
      id: 1,
      name: "Continental Breakfast",
      description: "Fresh croissants, seasonal fruits, yogurt, coffee and juice",
      price: "LKR 2,500",
      category: "breakfast",
      rating: 4.8,
      image: "/api/placeholder/300/200",
      available: "6:00 AM - 11:00 AM",
      popular: true
    },
    {
      id: 2,
      name: "Sri Lankan Rice & Curry",
      description: "Traditional rice and curry with multiple vegetable curries, sambol and papadam",
      price: "LKR 3,200",
      category: "lunch",
      rating: 4.9,
      image: "/api/placeholder/300/200",
      available: "12:00 PM - 3:00 PM",
      popular: true
    },
    {
      id: 3,
      name: "Grilled Salmon",
      description: "Atlantic salmon with roasted vegetables and lemon herb sauce",
      price: "LKR 4,800",
      category: "dinner",
      rating: 4.7,
      image: "/api/placeholder/300/200",
      available: "6:00 PM - 10:00 PM"
    },
    {
      id: 4,
      name: "Caesar Salad",
      description: "Crisp romaine lettuce with parmesan, croutons and classic caesar dressing",
      price: "LKR 2,200",
      category: "lunch",
      rating: 4.5,
      image: "/api/placeholder/300/200",
      available: "12:00 PM - 3:00 PM",
      vegetarian: true
    },
    {
      id: 5,
      name: "Fresh Juice Selection",
      description: "Orange, pineapple, watermelon, and mixed fruit juices",
      price: "LKR 800",
      category: "drinks",
      rating: 4.6,
      image: "/api/placeholder/300/200",
      available: "24 hours"
    },
    {
      id: 6,
      name: "Chef's Special Pasta",
      description: "House-made pasta with seasonal ingredients and signature sauce",
      price: "LKR 3,600",
      category: "dinner",
      rating: 4.8,
      image: "/api/placeholder/300/200",
      available: "6:00 PM - 10:00 PM",
      popular: true
    }
  ];

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-indigo-800 mb-4">
            Dining & Cuisine
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Experience exceptional dining at Grand Hotel. From traditional Sri Lankan cuisine
            to international favorites, our culinary team creates memorable dining experiences
            for every palate.
          </p>
        </div>

        {/* Restaurant Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card className="p-6 text-center">
            <ChefHat className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Award-Winning Chefs
            </h3>
            <p className="text-gray-600">
              Our culinary team brings decades of experience and creativity to every dish.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Users className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Intimate Dining
            </h3>
            <p className="text-gray-600">
              Enjoy personalized service in our elegant dining rooms accommodating up to 120 guests.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Clock className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              24/7 Service
            </h3>
            <p className="text-gray-600">
              Room service available around the clock with our extensive menu selection.
            </p>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center space-x-2"
            >
              <category.icon className="h-4 w-4" />
              <span>{category.name}</span>
            </Button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition duration-300">
              <div className="relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  {item.popular && (
                    <Badge className="bg-orange-500">
                      Popular
                    </Badge>
                  )}
                  {item.vegetarian && (
                    <Badge className="bg-green-500">
                      Vegetarian
                    </Badge>
                  )}
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-white px-2 py-1 rounded-full text-sm font-medium">
                    {item.price}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {item.name}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600">{item.rating}</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">
                  {item.description}
                </p>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Available: {item.available}</span>
                </div>

                <Button className="w-full">
                  Order Now
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Special Dining Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
            Special Dining Experiences
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8">
              <div className="flex items-center mb-6">
                <Wine className="h-12 w-12 text-indigo-600 mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Wine Tasting
                  </h3>
                  <p className="text-gray-600">Every Friday, 7:00 PM</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Join our sommelier for an exclusive wine tasting experience featuring
                premium selections from around the world.
              </p>
              <Button variant="outline">
                Reserve Your Spot
              </Button>
            </Card>

            <Card className="p-8">
              <div className="flex items-center mb-6">
                <ChefHat className="h-12 w-12 text-indigo-600 mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Chef&apos;s Table
                  </h3>
                  <p className="text-gray-600">By Reservation Only</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                An intimate dining experience where our executive chef creates
                a personalized menu just for you.
              </p>
              <Button variant="outline">
                Book Chef&apos;s Table
              </Button>
            </Card>
          </div>
        </div>

        {/* Room Service CTA */}
        <div className="mt-16 text-center">
          <Card className="p-8 bg-indigo-600 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Room Service Available 24/7
            </h2>
            <p className="text-indigo-100 mb-6 text-lg">
              Enjoy our full menu in the comfort of your room, any time of day or night.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-indigo-600 hover:bg-indigo-50">
                View Room Service Menu
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600">
                Call Room Service
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}