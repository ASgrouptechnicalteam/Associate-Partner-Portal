import { useState, useEffect } from 'react';
import { getTutorials } from '../../services/tutorialApi';
import type { Tutorial } from '../../types/tutorial';
import { BookOpen, Search, PlayCircle } from 'lucide-react';
import { useTutorial } from '../../context/TutorialContext';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function TutorialsList() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { startTutorial } = useTutorial();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchTutorials();
  }, []);

  useEffect(() => {
    const startSlug = searchParams.get('start');
    if (startSlug && tutorials.length > 0) {
      startTutorial(startSlug);
    }
  }, [searchParams, tutorials, startTutorial]);

  const fetchTutorials = async () => {
    try {
      const data = await getTutorials();
      setTutorials(data);
    } catch (err) {
      setError('Failed to load tutorials');
    } finally {
      setLoading(false);
    }
  };

  const filteredTutorials = tutorials.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-action-blue" />
            Tutorial Center
          </h1>
          <p className="text-gray-500 mt-1">Interactive step-by-step guides for using the portal.</p>
        </div>
      </div>

      <Card padding="md" className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tutorials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-app-bg border border-border-subtle rounded-lg focus:ring-2 focus:ring-action-blue focus:border-transparent outline-none transition-all"
          />
        </div>
      </Card>

      {filteredTutorials.length === 0 ? (
        <Card padding="xl" className="text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No tutorials found matching your search.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.map((tutorial) => (
            <Card key={tutorial.id} padding="none" className="flex flex-col h-full hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="info">{tutorial.category}</Badge>
                  <Badge variant="neutral">{tutorial.steps.length} Steps</Badge>
                </div>
                <h3 className="text-lg font-bold text-primary-navy mb-2">{tutorial.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {tutorial.description}
                </p>
              </div>
              <div className="p-4 border-t border-border-subtle bg-app-bg mt-auto">
                <Button
                  onClick={() => startTutorial(tutorial.slug)}
                  className="w-full flex items-center justify-center gap-2"
                  leftIcon={<PlayCircle className="w-4 h-4" />}
                >
                  Start Tutorial
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
