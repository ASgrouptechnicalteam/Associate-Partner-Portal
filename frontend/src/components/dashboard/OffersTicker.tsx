import React, { useState } from 'react';
import { Tag, Calendar, Gift, X } from 'lucide-react';

interface OfferData {
  id: string;
  title: string;
  description?: string;
  reward?: string;
  startDate?: string;
  endDate?: string;
  status: string;
}

interface OffersTickerProps {
  offers: OfferData[];
}

export const OffersTicker: React.FC<OffersTickerProps> = ({ offers }) => {
  const [selectedOffer, setSelectedOffer] = useState<OfferData | null>(null);

  if (!offers || offers.length === 0) return null;

  // Duplicate offers array once to ensure seamless infinite looping.
  // The CSS animation will translate from 0 to -50% of the total width.
  const displayOffers = [...offers, ...offers];

  return (
    <>
      <div className="w-full bg-primary-navy text-white rounded-lg overflow-hidden shadow-sm border border-deep-navy relative flex items-center mb-6">
        <div className="px-4 py-2.5 bg-brand-gold text-primary-navy font-bold text-sm z-10 flex items-center shadow-[4px_0_10px_rgba(0,0,0,0.1)] whitespace-nowrap">
          <Gift size={16} className="mr-2" />
          ACTIVE OFFERS
        </div>
        
        {/* Ticker Container - Must clip overflow */}
        <div className="flex-1 overflow-hidden h-full flex items-center relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
          {/* Scrolling Content */}
          <div className="flex whitespace-nowrap w-max animate-ticker items-center py-2">
            {displayOffers.map((offer, index) => (
              <div 
                key={`${offer.id}-${index}`}
                onClick={() => setSelectedOffer(offer)}
                className="inline-flex items-center mx-4 cursor-pointer hover:text-brand-gold transition-colors duration-200"
              >
                <Tag size={14} className="mr-1.5 text-brand-gold shrink-0" />
                <span className="font-semibold text-sm tracking-wide">{offer.title}</span>
                {offer.reward && (
                  <span className="ml-2 text-xs font-bold bg-white/10 px-2 py-0.5 rounded text-brand-gold">
                    {offer.reward}
                  </span>
                )}
                
                {/* Separator Dot */}
                <span className="mx-6 text-white/30">&bull;</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Offer Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
          >
            <div className="bg-primary-navy p-5 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center">
                <Gift className="mr-2 text-brand-gold" size={20} />
                Offer Details
              </h3>
              <button 
                onClick={() => setSelectedOffer(null)}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <h2 className="text-xl font-bold text-primary-text mb-3">{selectedOffer.title}</h2>
              
              {selectedOffer.description && (
                <p className="text-muted-text text-sm mb-5 whitespace-pre-wrap leading-relaxed">
                  {selectedOffer.description}
                </p>
              )}
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                {selectedOffer.reward && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-muted-text">Reward / Discount</span>
                    <span className="font-bold text-brand-gold">{selectedOffer.reward}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-text flex items-center">
                    <Calendar size={14} className="mr-1.5" /> Validity
                  </span>
                  <span className="text-sm font-semibold text-primary-text">
                    {selectedOffer.endDate ? new Date(selectedOffer.endDate).toLocaleDateString() : 'Ongoing'}
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <button 
                  onClick={() => setSelectedOffer(null)}
                  className="w-full bg-primary-navy text-white font-bold py-3 rounded-xl hover:bg-deep-navy transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(OffersTicker);
