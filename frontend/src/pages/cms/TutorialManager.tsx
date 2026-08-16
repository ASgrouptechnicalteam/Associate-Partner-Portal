import { useState, useEffect } from 'react';
import { getTutorials, createTutorial, updateTutorial, deleteTutorial, createTutorialStep, deleteTutorialStep, updateTutorialStep } from '../../services/tutorialApi';
import type { Tutorial, TutorialStep } from '../../types/tutorial';
import { Plus, Edit2, Trash2, Save, X, ListPlus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function TutorialManager() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Tutorial>>({});
  
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [stepData, setStepData] = useState<Partial<TutorialStep>>({});

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      const data = await getTutorials();
      setTutorials(data);
    } catch (err) {
      console.error('Failed to load tutorials');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createTutorial({
        title: 'New Tutorial',
        slug: 'new-tutorial-' + Date.now(),
        category: 'General',
        roleVisibility: [],
        isPublished: false,
        displayOrder: 0,
        description: 'Tutorial description'
      });
      fetchTutorials();
    } catch (err) {
      console.error('Failed to create tutorial');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateTutorial(id, formData);
      setEditingId(null);
      fetchTutorials();
    } catch (err) {
      console.error('Failed to update tutorial');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Tutorial?')) return;
    try {
      await deleteTutorial(id);
      fetchTutorials();
    } catch (err) {
      console.error('Failed to delete tutorial');
    }
  };

  const handleCreateStep = async (tutorialId: string) => {
    try {
      await createTutorialStep(tutorialId, {
        title: 'New Step',
        explanation: 'Step explanation',
        stepNumber: 1,
        targetSelector: ''
      });
      fetchTutorials();
    } catch (err) {
      console.error('Failed to create step');
    }
  };

  const handleUpdateStep = async (tutorialId: string, stepId: string) => {
    try {
      await updateTutorialStep(tutorialId, stepId, stepData);
      setEditingStepId(null);
      fetchTutorials();
    } catch (err) {
      console.error('Failed to update step');
    }
  };

  const handleDeleteStep = async (tutorialId: string, stepId: string) => {
    if (!confirm('Delete step?')) return;
    try {
      await deleteTutorialStep(tutorialId, stepId);
      fetchTutorials();
    } catch (err) {
      console.error('Failed to delete step');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Tutorials Manager</h1>
          <p className="mt-1 text-sm font-medium text-muted-text">
            Manage interactive tutorials and walkthroughs.
          </p>
        </div>
        <Button onClick={handleCreate} leftIcon={<Plus size={18} />}>
          Add Tutorial
        </Button>
      </div>

      <div className="space-y-6">
        {tutorials.map(tutorial => (
          <Card key={tutorial.id} padding="lg">
            {editingId === tutorial.id ? (
              <div className="space-y-4 mb-6 border-b border-border-subtle pb-6">
                <input 
                  type="text" 
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border-gray-300 p-2 rounded-md font-bold focus:ring-action-blue focus:border-action-blue"
                  placeholder="Title"
                />
                <input 
                  type="text" 
                  value={formData.slug || ''}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full border-gray-300 p-2 rounded-md focus:ring-action-blue focus:border-action-blue"
                  placeholder="Slug (e.g. how-to-book)"
                />
                <textarea 
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border-gray-300 p-2 rounded-md focus:ring-action-blue focus:border-action-blue"
                  rows={2}
                  placeholder="Description"
                />
                <div className="flex gap-4 items-center">
                  <input 
                    type="text" 
                    value={formData.category || ''}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="border-gray-300 p-2 rounded-md focus:ring-action-blue focus:border-action-blue"
                    placeholder="Category"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <input 
                      type="checkbox" 
                      checked={formData.isPublished || false}
                      onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="rounded text-action-blue focus:ring-action-blue"
                    />
                    Published
                  </label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button onClick={() => setEditingId(null)} variant="outline" leftIcon={<X size={16} />}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleUpdate(tutorial.id)} variant="success" leftIcon={<Save size={16} />}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-6 border-b border-border-subtle pb-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-primary-navy">{tutorial.title} <span className="text-sm font-normal text-gray-500">({tutorial.slug})</span></h3>
                  <div className="flex gap-2">
                    <Button onClick={() => {
                      setEditingId(tutorial.id);
                      setFormData(tutorial);
                    }} variant="ghost" className="p-2">
                      <Edit2 size={18} />
                    </Button>
                    <Button onClick={() => handleDelete(tutorial.id)} variant="ghost" className="p-2 text-red-600 hover:text-red-700">
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{tutorial.description}</p>
                <div className="flex gap-3 text-sm mb-3">
                  <Badge variant="neutral">Category: {tutorial.category}</Badge>
                  <Badge variant={tutorial.isPublished ? 'success' : 'warning'}>
                    {tutorial.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </div>
            )}

            <div className="pl-6 border-l-2 border-brand-gold/30">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-primary-navy">Steps</h4>
                <Button onClick={() => handleCreateStep(tutorial.id)} variant="ghost" leftIcon={<ListPlus size={16} />} size="sm">
                  Add Step
                </Button>
              </div>
              
              <div className="space-y-3">
                {tutorial.steps?.map((step) => (
                  <Card key={step.id} padding="md" className="bg-app-bg border border-border-subtle">
                    {editingStepId === step.id ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input 
                            type="number"
                            value={stepData.stepNumber || 0}
                            onChange={e => setStepData({ ...stepData, stepNumber: parseInt(e.target.value) })}
                            className="border-gray-300 p-2 rounded-md w-20 focus:ring-action-blue focus:border-action-blue"
                            placeholder="No."
                          />
                          <input 
                            type="text"
                            value={stepData.title || ''}
                            onChange={e => setStepData({ ...stepData, title: e.target.value })}
                            className="border-gray-300 p-2 rounded-md flex-1 font-semibold focus:ring-action-blue focus:border-action-blue"
                            placeholder="Step Title"
                          />
                        </div>
                        <textarea 
                          value={stepData.explanation || ''}
                          onChange={e => setStepData({ ...stepData, explanation: e.target.value })}
                          className="w-full border-gray-300 p-2 rounded-md focus:ring-action-blue focus:border-action-blue"
                          rows={2}
                          placeholder="Explanation"
                        />
                        <input 
                          type="text"
                          value={stepData.targetSelector || ''}
                          onChange={e => setStepData({ ...stepData, targetSelector: e.target.value })}
                          className="w-full border-gray-300 p-2 rounded-md font-mono text-sm focus:ring-action-blue focus:border-action-blue"
                          placeholder="Target CSS Selector (e.g. .btn-book)"
                        />
                        <div className="flex gap-2 justify-end mt-2">
                          <Button onClick={() => setEditingStepId(null)} variant="outline" size="sm" leftIcon={<X size={14} />}>
                            Cancel
                          </Button>
                          <Button onClick={() => handleUpdateStep(tutorial.id, step.id)} variant="success" size="sm" leftIcon={<Save size={14} />}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start">
                          <h5 className="font-semibold text-primary-navy">
                            <span className="text-gray-500 mr-2">{step.stepNumber}.</span> 
                            {step.title}
                          </h5>
                          <div className="flex gap-2">
                            <Button onClick={() => {
                              setEditingStepId(step.id);
                              setStepData(step);
                            }} variant="ghost" className="p-1 h-8 w-8">
                              <Edit2 size={14} />
                            </Button>
                            <Button onClick={() => handleDeleteStep(tutorial.id, step.id)} variant="ghost" className="p-1 h-8 w-8 text-red-600 hover:text-red-700">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{step.explanation}</p>
                        {step.targetSelector && (
                          <div className="mt-2 text-xs font-mono text-gray-500 bg-gray-200 px-2 py-1 rounded inline-block">
                            Selector: {step.targetSelector}
                          </div>
                        )}
                      </div>
                    )}
                    </Card>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
