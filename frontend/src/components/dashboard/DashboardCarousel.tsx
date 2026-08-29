import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getStaticUrl } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export interface CarouselItemData {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaTargetUrl: string | null;
  projectId: string | null;
}

interface Props {
  items: CarouselItemData[];
}

const DashboardCarousel: React.FC<Props> = ({ items }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!items || items.length === 0) {
    return null; // Or a placeholder if preferred
  }

  const currentItem = items[currentIndex];

  const handleCTA = () => {
    if (currentItem.projectId) {
      navigate(`/projects/${currentItem.projectId}`);
    } else if (currentItem.ctaTargetUrl) {
      navigate(currentItem.ctaTargetUrl);
    }
  };

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const goPrev = () => setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gray-50 aspect-[16/9] sm:aspect-[21/9] lg:aspect-[3/1] group shadow-none border-none">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
        style={{ backgroundImage: `url(${getStaticUrl(currentItem.imageUrl)})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-navy/80 to-transparent flex flex-col justify-center p-6 md:p-12">
        {currentItem.title && (
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-md">
            {currentItem.title}
          </h2>
        )}
        {currentItem.subtitle && (
          <p className="text-white/90 text-sm md:text-lg mb-6 max-w-md drop-shadow-sm">
            {currentItem.subtitle}
          </p>
        )}
        {(currentItem.ctaLabel) && (
          <div>
            <button 
              onClick={handleCTA}
              className="bg-brand-gold text-white px-6 py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors shadow-sm"
            >
              {currentItem.ctaLabel}
            </button>
          </div>
        )}
      </div>

      {items.length > 1 && (
        <>
          <button 
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(DashboardCarousel);
