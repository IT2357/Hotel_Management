import { Button } from "@/components/rooms/ui/button";
import { ArrowDown, Star, ChevronDown, Search } from "lucide-react";
import heroImage from "@/assets/images/guest/hotel-hero.jpg";
import { HOTEL_BRANDING, LOCATION_DATA } from "@/constants/sriLankanHotel";

const HotelHero = () => {
  return (
    <section className="relative h-[90vh] min-h-[600px] overflow-hidden bg-gray-900">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            filter: 'brightness(0.7)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/80" />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center">
        <div className="w-full max-w-5xl text-center">
          {/* Welcome Text */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white text-sm px-4 py-2 rounded-full mb-6 backdrop-blur-sm border border-white/10">
              <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
              <span>Luxury Accommodation & Fine Dining</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-serif leading-tight">
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">{HOTEL_BRANDING.name}</span>
               <br />
               <span className="text-3xl md:text-4xl text-gray-300">
                 Luxury & Comfort
               </span>
            </h1>
            
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 my-8 mx-auto"></div>
            
            <p className="text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed mb-10">
              Discover our exquisite collection of rooms and suites, each designed to provide the perfect blend of elegance and modern comfort for your stay.
              <br />
              <span className="text-lg text-indigo-200 mt-2 block">
                Located in {LOCATION_DATA.city}, {LOCATION_DATA.province}
              </span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 px-8 rounded-full text-base font-medium transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                size="lg"
              >
                Explore Our Rooms
                <ChevronDown className="ml-2 h-5 w-5 group-hover:translate-y-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                className="bg-transparent border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/30 py-6 px-8 rounded-full text-base font-medium transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                size="lg"
              >
                <Search className="mr-2 h-5 w-5" />
                Restaurant Menu
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
        <div className="flex flex-col items-center">
          <span className="text-xs text-indigo-300 mb-2 tracking-widest">SCROLL TO EXPLORE</span>
          <div className="w-px h-12 bg-gradient-to-b from-indigo-400 via-purple-400 to-transparent"></div>
        </div>
      </div>
      
      {/* Contact Information */}
      <div className="absolute bottom-6 right-6 z-10 text-right">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
          <div>{HOTEL_BRANDING.contact.phone}</div>
          <div>{HOTEL_BRANDING.location.address}</div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-1/4 -right-20 w-60 h-60 bg-purple-500/20 rounded-full filter blur-3xl"></div>
    </section>
  );
};

export default HotelHero;