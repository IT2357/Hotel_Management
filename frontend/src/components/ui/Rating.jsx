import React from 'react';
import { Star } from 'lucide-react';

const Rating = ({ rating, maxRating = 5, size = 'md', showValue = true, onChange, readOnly = true, className = '' }) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  // Size configurations
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const iconSize = sizeClasses[size] || sizeClasses.md;
  const textSize = textSizeClasses[size] || textSizeClasses.md;

  const handleClick = (value) => {
    if (!readOnly && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readOnly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;
          const isPartial = !Number.isInteger(displayRating) && 
                           starValue === Math.ceil(displayRating) && 
                           starValue > Math.floor(displayRating);

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={readOnly}
              className={`
                ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                transition-transform duration-150
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded
                disabled:cursor-default
              `}
              aria-label={`Rate ${starValue} out of ${maxRating}`}
            >
              <div className="relative">
                <Star
                  className={`${iconSize} ${
                    isFilled
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-none text-gray-300'
                  } transition-colors duration-150`}
                />
                {isPartial && (
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${(displayRating % 1) * 100}%` }}
                  >
                    <Star
                      className={`${iconSize} fill-yellow-400 text-yellow-400`}
                    />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={`${textSize} font-medium text-gray-700 ml-1`}>
          {rating ? rating.toFixed(1) : '0.0'}
        </span>
      )}
    </div>
  );
};

export default Rating;