import { useState, useEffect } from 'react';
import { getFaqs, createFaq, updateFaq, deleteFaq } from '../../services/faqApi';
import type { Faq } from '../../types/faq';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function FaqManager() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Faq>>({});

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const data = await getFaqs();
      setFaqs(data);
    } catch (err) {
      console.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createFaq({
        question: 'New Question',
        answer: 'New Answer',
        category: 'General',
        roleVisibility: [],
        isPublished: false,
        displayOrder: 0
      });
      fetchFaqs();
    } catch (err) {
      console.error('Failed to create FAQ');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateFaq(id, formData);
      setEditingId(null);
      fetchFaqs();
    } catch (err) {
      console.error('Failed to update FAQ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await deleteFaq(id);
      fetchFaqs();
    } catch (err) {
      console.error('Failed to delete FAQ');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">FAQ Manager</h1>
          <p className="mt-1 text-sm font-medium text-muted-text">
            Manage frequently asked questions and answers.
          </p>
        </div>
        <Button onClick={handleCreate} leftIcon={<Plus size={18} />}>
          Add FAQ
        </Button>
      </div>

      <div className="space-y-4">
        {faqs.map(faq => (
          <Card key={faq.id} padding="md">
            {editingId === faq.id ? (
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={formData.question || ''}
                  onChange={e => setFormData({ ...formData, question: e.target.value })}
                  className="w-full border-gray-300 p-2 rounded-md font-bold focus:ring-action-blue focus:border-action-blue"
                  placeholder="Question"
                />
                <textarea 
                  value={formData.answer || ''}
                  onChange={e => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full border-gray-300 p-2 rounded-md focus:ring-action-blue focus:border-action-blue"
                  rows={3}
                  placeholder="Answer"
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
                  <Button onClick={() => handleUpdate(faq.id)} variant="success" leftIcon={<Save size={16} />}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-primary-navy">{faq.question}</h3>
                  <div className="flex gap-2">
                    <Button onClick={() => {
                      setEditingId(faq.id);
                      setFormData(faq);
                    }} variant="ghost" className="p-2">
                      <Edit2 size={18} />
                    </Button>
                    <Button onClick={() => handleDelete(faq.id)} variant="ghost" className="p-2 text-red-600 hover:text-red-700">
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{faq.answer}</p>
                <div className="flex gap-3 text-sm">
                  <Badge variant="neutral">Category: {faq.category}</Badge>
                  <Badge variant={faq.isPublished ? 'success' : 'warning'}>
                    {faq.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
