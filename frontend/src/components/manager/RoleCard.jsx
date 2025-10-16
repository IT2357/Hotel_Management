import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/manager/ManagerCard';
// import { Button } from '@/components/ui/button'; // Not used in this component

const RoleCard = ({ title, description, icon, features, path, onClick }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      console.log(`Navigating to: ${path}`);
      navigate(path);
    }
  };

  // Handle both string icons (emojis) and React component icons
  const renderIcon = () => {
    if (typeof icon === 'string') {
      return <div className="text-4xl">{icon}</div>;
    } else if (React.isValidElement(icon)) {
      return <div className="text-4xl">{icon}</div>;
    } else {
      return <div className="text-4xl">📋</div>; // Default fallback
    }
  };

  return (
    <Card
      className="bg-white rounded-xl shadow hover:shadow-2xl transition-all duration-300 border border-slate-200 overflow-hidden group cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="p-6">
        <div className="flex items-center justify-between mb-4">
          {renderIcon()}
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
            <div className="text-blue-600 group-hover:text-white transition-colors">→</div>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900 mb-2">{title}</CardTitle>
        <CardDescription className="text-slate-600">{description}</CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="space-y-2">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center text-sm text-slate-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <button
          onClick={handleCardClick}
          className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 py-3 text-sm font-semibold text-white shadow-md transition-transform duration-200 hover:from-blue-600 hover:to-indigo-600 hover:-translate-y-0.5"
        >
          {`Access ${title} Panel`}
        </button>
      </CardFooter>
    </Card>
  );
};

export default RoleCard;
