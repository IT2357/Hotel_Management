import { Button } from "@/components/rooms/ui/button";
import { Calendar, MapPin, Star } from "lucide-react";
import heroImage from "@/assets/images/guest/hotel-hero.jpg";

const HotelHero = () => {
  return (
    <section className="relative h-[70vh] overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
        <div className="max-w-2xl text-white animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-primary-glow font-medium">Luxury Experience</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 leading-tight">
            Experience
            <span className="block text-primary-glow">Luxury Redefined</span>
          </h1>
          
          <p className="text-xl mb-8 text-gray-200 leading-relaxed">
            Discover our collection of beautifully designed rooms with stunning views, 
            premium amenities, and personalized service that exceeds expectations.
          </p>
          
          <div className="flex items-center gap-3 mb-8">
            <MapPin className="w-5 h-5 text-primary-glow" />
            <span className="text-gray-200">Prime Downtown Location</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="luxury" 
              size="lg"
              className="text-lg px-8 py-6"
            >
              <Calendar className="w-5 h-5" />
              Book Your Stay
            </Button>
            <Button 
              variant="hero" 
              size="lg"
              className="text-lg px-8 py-6"
            >
              View Rooms
            </Button>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute bottom-10 right-10 animate-float">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white">
          <div className="text-3xl font-display font-bold text-primary-glow">
            4.9
          </div>
          <div className="text-sm text-gray-200">Guest Rating</div>
        </div>
      </div>
    </section>
  );
};

export default HotelHero;