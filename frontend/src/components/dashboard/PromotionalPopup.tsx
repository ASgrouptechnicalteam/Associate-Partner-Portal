import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getStaticUrl } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export interface PromotionalPopupData {
  id: string;
  heading: string;
  description: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaTargetUrl: string | null;
  projectId: string | null;
}

interface Props {
  popup: PromotionalPopupData | null;
}

const PromotionalPopup: React.FC<Props> = ({ popup }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (popup && !sessionStorage.getItem(`popup_dismissed_${popup.id}`)) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [popup]);

  if (!popup || !isOpen) return null;

  const handleClose = () => {
    sessionStorage.setItem(`popup_dismissed_${popup.id}`, 'true');
    setIsOpen(false);
  };

  const handleCTA = () => {
    handleClose();
    if (popup.projectId) {
      navigate(`/projects/${popup.projectId}`);
    } else if (popup.ctaTargetUrl) {
      navigate(popup.ctaTargetUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-navy/50 p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 bg-black/10 hover:bg-black/20 text-gray-800 rounded-full transition-colors z-10"
          aria-label="Close popup"
        >
          <X size={20} />
        </button>

        {popup.imageUrl && (
          <div className="w-full h-48 bg-gray-100 relative">
            <img 
              src={getStaticUrl(popup.imageUrl)} 
              alt={popup.heading} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-primary-navy mb-2">{popup.heading}</h3>
          {popup.description && (
            <p className="text-gray-600 text-sm mb-6 whitespace-pre-wrap">{popup.description}</p>
          )}
          
          {popup.ctaLabel ? (
            <button
              onClick={handleCTA}
              className="w-full bg-brand-gold text-white font-semibold py-2.5 rounded-lg hover:bg-opacity-90 transition-colors shadow-sm"
            >
              {popup.ctaLabel}
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="w-full border border-gray-200 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(PromotionalPopup);
