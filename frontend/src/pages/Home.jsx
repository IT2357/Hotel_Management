import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Info, Image, Phone, ChefHat, ShoppingCart, Bed, Calendar, Menu, X, User, Heart, FileText, MessageSquare, ChevronDown, ChevronUp, Star, CheckCircle, Clock, MapPin, LogIn, LogOut } from 'lucide-react';

export default function HomePage() {
	// TODO: Implement HomePage component
	// The full HomePage.jsx implementation is now in Home.jsx
	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-center">
				<h1 className="text-3xl font-bold mb-4">Welcome to Grand Hotel</h1>
				<p className="text-gray-600 mb-8">Your luxurious stay awaits</p>
				<Link to="/rooms" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
					Explore Rooms
				</Link>
			</div>
		</div>
	);
}
