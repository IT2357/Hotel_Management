import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Download } from 'lucide-react';
import Button from '../ui/Button';

export default function RoomGallery({ images, roomTitle, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = images[currentImageIndex];
    link.download = `${roomTitle}-image-${currentImageIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ImageModal = ({ isFullscreen = false }) => (
    <div className={`fixed inset-0 bg-black z-50 flex items-center justify-center ${
      isFullscreen ? 'p-0' : 'p-4'
    }`}>
      <div className={`relative ${isFullscreen ? 'w-full h-full' : 'max-w-4xl max-h-full'}`}>
        {/* Close Button */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-75"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Fullscreen Toggle */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 right-16 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-75"
          onClick={toggleFullscreen}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

        {/* Download Button */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 right-28 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-75"
          onClick={downloadImage}
        >
          <Download className="h-4 w-4" />
        </Button>

        {/* Main Image */}
        <div className={`relative ${isFullscreen ? 'h-full' : 'h-full'}`}>
          <img
            src={images[currentImageIndex]}
            alt={`${roomTitle} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-contain"
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-75"
                onClick={prevImage}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-75"
                onClick={nextImage}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-4">
            <div className="flex space-x-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex
                      ? 'border-white'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger Modal */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 cursor-pointer"
        onClick={() => setIsFullscreen(true)}
      >
        {/* Main Image */}
        <div className="lg:col-span-2 lg:row-span-2">
          <img
            src={images[0]}
            alt={`${roomTitle} - Main`}
            className="w-full h-64 lg:h-80 object-cover rounded-lg"
          />
        </div>

        {/* Thumbnail Images */}
        {images.slice(1, 5).map((image, index) => (
          <div key={index} className={index === 3 && images.length > 4 ? 'relative' : ''}>
            <img
              src={image}
              alt={`${roomTitle} - ${index + 2}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            {index === 3 && images.length > 4 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <span className="text-white font-medium">
                  +{images.length - 4} more
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {isFullscreen && <ImageModal isFullscreen={true} />}
    </>
  );
}