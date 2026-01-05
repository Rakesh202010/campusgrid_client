import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Loader2,
  Palette
} from 'lucide-react';
import { streams } from '../services/api';
import { toast } from '../utils/toast';

// Predefined common streams
const COMMON_STREAMS = [
  { name: 'Science', code: 'SCIENCE', displayName: 'Science', color: '#3B82F6', orderIndex: 1, description: 'Science stream with Physics, Chemistry, Biology/Mathematics' },
  { name: 'Commerce', code: 'COMMERCE', displayName: 'Commerce', color: '#10B981', orderIndex: 2, description: 'Commerce stream with Accountancy, Business Studies, Economics' },
  { name: 'Arts', code: 'ARTS', displayName: 'Arts', color: '#EC4899', orderIndex: 3, description: 'Arts/Humanities stream with History, Geography, Literature' },
  { name: 'Science (PCM)', code: 'PCM', displayName: 'Science (PCM)', color: '#8B5CF6', orderIndex: 4, description: 'Physics, Chemistry, Mathematics' },
  { name: 'Science (PCB)', code: 'PCB', displayName: 'Science (PCB)', color: '#06B6D4', orderIndex: 5, description: 'Physics, Chemistry, Biology' },
];

const StreamsConfiguration = () => {
  const [streamsList, setStreamsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStreamModal, setShowStreamModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingStream, setEditingStream] = useState(null);
  const [streamForm, setStreamForm] = useState({
    name: '',
    code: '',
    displayName: '',
    description: '',
    color: '#6366F1',
    orderIndex: 0,
    isActive: true
  });

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    setLoading(true);
    try {
      const res = await streams.getAll({ is_active: 'true' });
      if (res?.success) {
        setStreamsList(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
      toast.error('Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  const openStreamModal = (stream = null) => {
    if (stream) {
      setEditingStream(stream);
      setStreamForm({
        name: stream.name || '',
        code: stream.code || '',
        displayName: stream.displayName || '',
        description: stream.description || '',
        color: stream.color || '#6366F1',
        orderIndex: stream.orderIndex || 0,
        isActive: stream.isActive !== false
      });
    } else {
      setEditingStream(null);
      setStreamForm({
        name: '',
        code: '',
        displayName: '',
        description: '',
        color: '#6366F1',
        orderIndex: streamsList.length,
        isActive: true
      });
    }
    setShowStreamModal(true);
  };

  const handleStreamSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingStream) {
        response = await streams.update(editingStream.id, streamForm);
      } else {
        response = await streams.create(streamForm);
      }

      if (response?.success) {
        toast.success(editingStream ? 'Stream updated' : 'Stream created');
        setShowStreamModal(false);
        fetchStreams();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving stream:', error);
      toast.error('Failed to save stream');
    }
  };

  const handleDeleteStream = async (id) => {
    try {
      const response = await streams.delete(id);
      if (response?.success) {
        toast.success('Stream deleted');
        setShowDeleteConfirm(null);
        fetchStreams();
      } else {
        toast.error(response?.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting stream:', error);
      toast.error('Failed to delete stream');
    }
  };

  const handleQuickAddStreams = async () => {
    const existingCodes = streamsList.map(s => s.code);
    const toAdd = COMMON_STREAMS.filter(s => !existingCodes.includes(s.code));
    
    if (toAdd.length === 0) {
      toast.info('All common streams already exist');
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      for (const stream of toAdd) {
        try {
          const response = await streams.create(stream);
          if (response?.success) {
            successCount++;
          } else {
            failCount++;
            errors.push(`${stream.name}: ${response?.message || 'Unknown error'}`);
          }
        } catch (error) {
          failCount++;
          console.error(`Error adding stream ${stream.name}:`, error);
          errors.push(`${stream.name}: ${error.message || 'Failed to add'}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Added ${successCount} common streams${failCount > 0 ? ` (${failCount} failed)` : ''}`);
        fetchStreams();
      } else {
        const errorMsg = errors.length > 0 ? errors[0] : 'Failed to add streams';
        toast.error(errorMsg);
        console.error('Stream creation errors:', errors);
      }
    } catch (error) {
      console.error('Error in handleQuickAddStreams:', error);
      toast.error(`Failed to add streams: ${error.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Streams / Courses Configuration</h1>
        <p className="text-gray-600 mt-1">Manage academic streams for higher classes (Science, Commerce, Arts, etc.)</p>
      </div>

      {/* Main Content */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Academic Streams</h3>
            <p className="text-sm text-gray-500 mt-1">Configure streams for class specialization</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleQuickAddStreams}
              className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
            >
              Quick Add Common
            </button>
            <button
              onClick={() => openStreamModal()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4" />
              Add Stream
            </button>
          </div>
        </div>

        {streamsList.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Streams Yet</h3>
            <p className="text-gray-600 mb-4">Create streams to organize higher-class specializations</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleQuickAddStreams}
                className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Quick Add Common Streams
              </button>
              <span className="text-gray-400">or</span>
              <button
                onClick={() => openStreamModal()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first stream
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streamsList.map(stream => (
              <div
                key={stream.id}
                className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: stream.color || '#6366F1' }}
                    >
                      {stream.code?.substring(0, 2) || stream.name?.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{stream.displayName || stream.name}</h4>
                      <p className="text-xs text-gray-500">{stream.code}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openStreamModal(stream)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm({ type: 'stream', item: stream })}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {stream.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{stream.description}</p>
                )}

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    stream.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {stream.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STREAM MODAL */}
      {showStreamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingStream ? 'Edit Stream' : 'Add New Stream'}
                </h3>
                <button onClick={() => setShowStreamModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleStreamSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stream Name *</label>
                <input
                  type="text"
                  value={streamForm.name}
                  onChange={(e) => setStreamForm({ ...streamForm, name: e.target.value })}
                  placeholder="e.g., Science"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={streamForm.code}
                    onChange={(e) => setStreamForm({ ...streamForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SCIENCE"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={streamForm.color}
                    onChange={(e) => setStreamForm({ ...streamForm, color: e.target.value })}
                    className="w-full h-10 border border-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={streamForm.displayName}
                  onChange={(e) => setStreamForm({ ...streamForm, displayName: e.target.value })}
                  placeholder="e.g., Science"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={streamForm.description}
                  onChange={(e) => setStreamForm({ ...streamForm, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of the stream..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={streamForm.isActive}
                  onChange={(e) => setStreamForm({ ...streamForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowStreamModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
                >
                  {editingStream ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Delete this stream? Students assigned to this stream will need to be updated.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteStream(showDeleteConfirm.item.id);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamsConfiguration;

