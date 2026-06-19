import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Plus, 
  User, 
  Calendar,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAuth, API_URL } from '../context/AuthContext';

export default function Documents() {
  const { token, isAdmin } = useAuth();
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchAllDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        setError('Failed to fetch documents.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDocuments();
  }, [token]);

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document permanent record?')) return;
    try {
      const response = await fetch(`${API_URL}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setDocuments(prev => prev.filter(d => d._id !== docId));
      } else {
        alert('Failed to delete document.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Perform filter
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.member?.fullName?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = !categoryFilter || doc.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Family Documents</h1>
        <p className="text-slate-500 text-sm">Browse and manage all uploaded certificates, records, and ID card scans.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-premium flex flex-col md:flex-row md:items-center gap-4">
        
        {/* Search */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by title or family member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:bg-white transition-all text-slate-700"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2">
          {['', 'ID Card', 'Birth Certificate', 'Academic', 'Other'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                categoryFilter === cat 
                  ? 'bg-primary-600 text-black border-primary-600 shadow-md shadow-primary-100' 
                  : 'bg-white border-slate-200/60 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {cat === '' ? 'All categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Files */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500">
          <Info className="w-8 h-8 mx-auto mb-2 text-red-400" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-100 shadow-premium">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300 animate-bounce" />
          <h4 className="font-semibold text-slate-700 text-sm">No family documents uploaded</h4>
          <p className="text-xs mt-1 text-slate-400">Go to a member's profile page and upload records (ID cards, scans) to display them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <motion.div 
              key={doc._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-premium shadow-card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase">
                    {doc.category}
                  </span>
                </div>

                <div className="mt-4">
                  <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1">{doc.title}</h4>
                  <p className="text-slate-400 text-[10px] mt-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Member: {doc.member?.fullName || 'Unlinked'}</span>
                  </p>
                  <p className="text-slate-400 text-[10px] mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-3 mt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
                  {doc.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <a 
                    href={doc.fileUrl.startsWith('/uploads/') ? `${import.meta.env.MODE === 'production' ? '' : 'http://localhost:5000'}${doc.fileUrl}` : doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Get File</span>
                  </a>
                  
                  {isAdmin && (
                    <button 
                      onClick={() => handleDelete(doc._id)}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
}
