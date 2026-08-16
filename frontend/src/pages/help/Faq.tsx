import { useState, useEffect } from 'react';
import { getFaqs } from '../../services/faqApi';
import type { Faq } from '../../types/faq';
import { Search, HelpCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const data = await getFaqs();
      setFaqs(data);
    } catch (err) {
      setError('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(faqs.map(f => f.category)));

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(search.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? faq.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-navy flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-action-blue" />
          Help Center & FAQs
        </h1>
      </div>

      <Card padding="md" className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for answers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-app-bg border border-border-subtle rounded-lg focus:ring-2 focus:ring-action-blue focus:border-transparent outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null ? 'bg-primary-navy text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat ? 'bg-primary-navy text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <Card padding="xl" className="text-center">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No FAQs found matching your criteria.</p>
          </Card>
        ) : (
          filteredFaqs.map((faq) => (
            <Card key={faq.id} padding="none" className="overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-app-bg transition-colors text-left"
              >
                <span className="font-medium text-primary-navy">{faq.question}</span>
                {expandedId === faq.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              
              {expandedId === faq.id && (
                <div className="px-6 pb-5 pt-2">
                  <div className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                    {faq.answer}
                  </div>
                  
                  {faq.relatedTutorialSlug && (
                    <div className="mt-4 pt-4 border-t border-border-subtle">
                      <Link 
                        to={`/tutorials?start=${faq.relatedTutorialSlug}`}
                        className="inline-flex items-center text-sm font-medium text-action-blue hover:text-blue-700"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Watch Step-by-Step Tutorial
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
