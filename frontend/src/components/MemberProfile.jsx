import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Lock, 
  Eye, 
  EyeOff, 
  FileText, 
  Trash2, 
  Plus, 
  Clock, 
  Activity,
  Heart,
  ChevronRight,
  Shield,
  Edit2,
  FileCheck,
  UserCheck,
  StickyNote
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import { calculateRelation } from '../utils/relationCalculator';
import getProfileImage from '../utils/getProfileImage';

export default function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  // Use 'root' if no id is provided (i.e. user's own profile)
  const memberId = id || 'root';
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Aadhaar visibility toggle state
  const [revealAadhaar, setRevealAadhaar] = useState(false);
  
  // Documents state
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [docName, setDocName] = useState('');
  
  // Notes state
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/members/${memberId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMember(data);
          setNotes(data.notes || '');
          fetchDocuments();
        } else {
          setError('Failed to load member profile details.');
        }
      } catch (err) {
        console.error(err);
        setError('Network failure.');
      } finally {
        setLoading(false);
      }
    }

    async function fetchDocuments() {
      try {
        const res = await fetch(`${API_URL}/documents/${memberId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDocuments(data);
        }
      } catch (e) {
        console.error('Failed to load documents', e);
      }
    }

    if (memberId) {
      fetchDetails();
    }
  }, [memberId, token]);

  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!docFile || !docName.trim()) return;

    setUploadingDoc(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;

      try {
        const response = await fetch(`${API_URL}/documents`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            documentMimeType: docFile.type,
            name: docName,
            title: docName, // API expects 'title'
            category: 'Other', // default
            memberId: memberId,
            fileBase64: base64Data
          })
        });
        
        if (response.ok) {
          const newDoc = await response.json();
          setDocuments(prev => [...prev, newDoc]);
          setDocFile(null);
          setDocName('');
          // Reset file input
          e.target.reset();
        } else {
          alert('Failed to upload document.');
        }
      } catch (err) {
        console.error(err);
        alert('Upload network error.');
      } finally {
        setUploadingDoc(false);
      }
    };
    reader.readAsDataURL(docFile);
  };

  const handleDocDelete = async (docId) => {
    if (!window.confirm('Delete this document from vault?')) return;

    try {
      const response = await fetch(`${API_URL}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setDocuments(prev => prev.filter(d => d._id !== docId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const response = await fetch(`${API_URL}/members/${memberId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ notes })
      });
      if (response.ok) {
        alert('Notes updated successfully!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-saas-primary border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-black/70 uppercase tracking-wider">Syncing Vault...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-saas-card border border-saas-border rounded-3xl p-8 flex flex-col items-center gap-4 text-center max-w-sm">
          <span className="text-rose-500 font-extrabold text-sm">Profile Load Failed</span>
          <p className="text-xs text-black/70">{error || 'Record is missing.'}</p>
          <button onClick={() => navigate('/members')} className="px-5 py-2 bg-saas-bg rounded-xl border border-saas-border text-xs font-semibold hover:bg-saas-border/50 transition-colors cursor-pointer">
            Return to Directory
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.memberProfile && member._id.toString() === user.memberProfile.toString();
  const showEdit = isOwner || member.createdBy === user?.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/members')}
          className="px-4 py-2 rounded-xl bg-saas-card border border-saas-border hover:bg-saas-bg text-black/70 hover:text-black transition-all shadow-sm flex items-center gap-2 cursor-pointer text-xs font-bold"
        >
          <X className="w-4 h-4" />
          Back to Members
        </button>
        
        {showEdit && (
          <button 
            onClick={() => navigate(`/members?action=edit&id=${member._id}`)}
            className="px-4 py-2 rounded-xl bg-saas-primary text-black hover:bg-opacity-90 transition-all shadow-sm shadow-saas-primary/20 flex items-center gap-2 cursor-pointer text-xs font-bold"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Main Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-saas-card border border-saas-border rounded-3xl overflow-hidden shadow-saas-card relative"
      >
          
          {/* Cover Header Banner */}
          <div className="h-44 bg-gradient-to-r from-saas-primary/20 via-saas-accent/20 to-saas-primary/10 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
          </div>

          {/* Profile Details Header Section */}
          <div className="px-6 md:px-8 relative -mt-16 border-b border-saas-border/40 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              
              {/* Avatar circle */}
              <div 
                className="w-28 h-28 rounded-full border-4 border-saas-card bg-saas-card shadow-lg overflow-hidden flex items-center justify-center relative z-10 flex-shrink-0 cursor-pointer"
                onClick={() => setIsImageExpanded(true)}
              >
                {getProfileImage(member) ? (
                  <img 
                    src={getProfileImage(member)} 
                    alt={member.fullName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-black text-3xl text-black/70">
                    {member.fullName.charAt(0)}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-black text-black tracking-tight leading-tight">
                  {member.fullName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[9px] font-black text-saas-primary bg-saas-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {member.relation}
                  </span>
                  <span className="text-[9px] font-bold text-black/70 bg-saas-bg border border-saas-border px-2 py-0.5 rounded-md">
                    {member.gender}
                  </span>
                  {member.maritalStatus === 'Married' && (
                    <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Heart className="w-2.5 h-2.5 fill-rose-500/10" />
                      <span>Married</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details Body Grid layout */}
          <div className="p-6 md:p-8 space-y-8">
            
            {/* Permitted Aadhaar Card Panel */}
            <div className="bg-saas-bg/40 border border-saas-border/60 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-saas-primary/10 text-saas-primary flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-black uppercase tracking-wide">Aadhaar Identification</h4>
                  <p className="text-[10px] text-black/70 leading-none mt-1">Encrypted personal identity number.</p>
                </div>
              </div>

              {/* Reveal controllers */}
              {member.isAadhaarPrivate && !isOwner ? (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-black/70 bg-saas-bg border border-saas-border px-3 py-1.5 rounded-lg">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Hidden (Private Field)</span>
                </div>
              ) : (
                <button 
                  onClick={() => setRevealAadhaar(!revealAadhaar)}
                  className="flex items-center gap-1.5 bg-saas-card border border-saas-border hover:bg-saas-bg text-black/70 hover:text-black font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
                >
                  {revealAadhaar ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide Number</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reveal Number</span>
                    </>
                  )}
                </button>
              )}

              {revealAadhaar && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="font-black text-sm text-black bg-saas-card border border-saas-primary/30 px-4 py-2 rounded-xl"
                >
                  {member.aadhaarNumber || 'Not provided'}
                </motion.div>
              )}
            </div>

            {/* Grid Personal Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* DOB */}
              <div className="bg-saas-card border border-saas-border/60 p-4.5 rounded-2xl shadow-saas-card flex gap-3.5">
                <Calendar className="w-4.5 h-4.5 text-saas-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] font-bold text-black/70 uppercase tracking-wider">Date of Birth</span>
                  <p className="font-extrabold text-xs text-black mt-1">
                    {member.isDobPrivate && !isOwner ? 'Hidden (Private)' : (member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : 'N/A')}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-saas-card border border-saas-border/60 p-4.5 rounded-2xl shadow-saas-card flex gap-3.5">
                <Phone className="w-4.5 h-4.5 text-saas-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] font-bold text-black/70 uppercase tracking-wider">Phone Number</span>
                  <p className="font-extrabold text-xs text-black mt-1">
                    {member.isPhonePrivate && !isOwner ? 'Hidden (Private)' : (member.phoneNumber || 'N/A')}
                  </p>
                </div>
              </div>

              {/* Job */}
              <div className="bg-saas-card border border-saas-border/60 p-4.5 rounded-2xl shadow-saas-card flex gap-3.5">
                <Briefcase className="w-4.5 h-4.5 text-saas-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] font-bold text-black/70 uppercase tracking-wider">Occupation</span>
                  <p className="font-extrabold text-xs text-black mt-1">
                    {member.isOccupationPrivate && !isOwner ? 'Hidden (Private)' : (member.occupation || 'N/A')}
                  </p>
                </div>
              </div>

              {/* City */}
              <div className="bg-saas-card border border-saas-border/60 p-4.5 rounded-2xl shadow-saas-card flex gap-3.5">
                <MapPin className="w-4.5 h-4.5 text-saas-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] font-bold text-black/70 uppercase tracking-wider">Address</span>
                  <p className="font-extrabold text-xs text-black mt-1">
                    {member.isAddressPrivate && !isOwner ? 'Hidden (Private)' : (member.address || 'N/A')}
                  </p>
                </div>
              </div>

            </div>

            {/* Custom key-value fields list */}
            {member.customFields && member.customFields.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-black uppercase tracking-wider">Additional Attributes</h4>
                <div className="grid grid-cols-2 gap-4">
                  {member.customFields.map((field, idx) => (
                    <div key={idx} className="bg-saas-card border border-saas-border p-3.5 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-black/70 font-semibold">{field.key}:</span>
                      <span className="font-bold text-black">
                        {field.isPrivate && !isOwner ? 'Hidden (Private)' : field.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lineage Timeline Section */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-xs text-black uppercase tracking-wider">Ancestral Connections</h4>
              
              <div className="border border-saas-border rounded-2xl divide-y divide-saas-border overflow-hidden bg-saas-card">
                
                {/* Father */}
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-black/70 font-semibold">Father Link</span>
                  {member.father ? (
                    <span className="font-extrabold text-black">{member.father.fullName || member.father}</span>
                  ) : (
                    <span className="text-slate-400 italic">Unlinked</span>
                  )}
                </div>

                {/* Mother */}
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-black/70 font-semibold">Mother Link</span>
                  {member.mother ? (
                    <span className="font-extrabold text-black">{member.mother.fullName || member.mother}</span>
                  ) : (
                    <span className="text-slate-400 italic">Unlinked</span>
                  )}
                </div>

                {/* Spouse */}
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-black/70 font-semibold">Spouse Link</span>
                  {member.spouse ? (
                    <span className="font-extrabold text-black">{member.spouse.fullName || member.spouse}</span>
                  ) : (
                    <span className="text-slate-400 italic">Unlinked</span>
                  )}
                </div>

              </div>
            </div>

            {/* Document Vault Gallery */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-saas-primary" />
                <h4 className="font-extrabold text-xs text-black uppercase tracking-wider">Documents Vault</h4>
              </div>

              {/* Upload forms */}
              {showEdit && (
                <form onSubmit={handleDocUpload} className="bg-saas-bg/30 border border-saas-border border-dashed p-4 rounded-2xl flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text"
                      required
                      placeholder="Document Name (e.g. Birth Certificate)"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="px-3 py-1.5 border border-saas-border bg-saas-card rounded-xl text-xs focus:outline-none focus:border-saas-primary text-black"
                    />
                    <input 
                      type="file"
                      required
                      onChange={(e) => setDocFile(e.target.files[0])}
                      className="text-xs text-black/70 mt-1 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-saas-primary/15 file:text-saas-primary file:cursor-pointer"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploadingDoc || !docFile || !docName.trim()}
                    className="self-end py-1.5 px-4 bg-saas-primary hover:bg-opacity-95 text-black rounded-xl text-[10px] font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{uploadingDoc ? 'Uploading...' : 'Upload File'}</span>
                  </button>
                </form>
              )}

              {/* Gallery lists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div key={doc._id} className="p-3.5 bg-saas-card border border-saas-border rounded-xl flex items-center justify-between text-xs hover:border-saas-primary transition-colors shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="w-5 h-5 text-saas-primary flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="font-extrabold text-black truncate">{doc.name}</p>
                        <span className="text-[9px] text-black/70 mt-0.5 block">Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a 
                        href={doc.fileUrl || doc.filePath} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[9px] font-bold text-saas-primary bg-saas-primary/10 px-2.5 py-1 rounded-md"
                      >
                        Open
                      </a>
                      {showEdit && (
                        <button 
                          onClick={() => handleDocDelete(doc._id)}
                          className="p-1 rounded-md text-black/70 hover:text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {documents.length === 0 && (
                  <div className="col-span-2 text-center p-6 text-slate-400 text-xs italic">
                    No documents uploaded to this profile.
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-3 border-t border-saas-border/40 pt-6">
              <h4 className="font-extrabold text-xs text-black uppercase tracking-wider">Biography & Notes</h4>
              <textarea 
                rows="4"
                disabled={!showEdit}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-4 border border-saas-border bg-saas-card rounded-2xl text-xs focus:outline-none focus:border-saas-primary text-black leading-relaxed shadow-sm disabled:bg-saas-bg/50"
                placeholder="Write notes about this family member..."
              />
              {showEdit && (
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="py-2 px-5 bg-saas-primary hover:bg-opacity-95 text-black rounded-xl text-xs font-bold shadow-md shadow-saas-primary/10 flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <span>{savingNotes ? 'Saving...' : 'Save Notes'}</span>
                </button>
              )}
            </div>

        </div>
      </motion.div>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {isImageExpanded && getProfileImage(member) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setIsImageExpanded(false)}
          >
            <motion.img 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={getProfileImage(member)} 
              alt={member.fullName} 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              className="absolute top-6 right-6 text-black/ hover:text-black p-2 bg-white/10 rounded-full transition-colors cursor-pointer"
              onClick={() => setIsImageExpanded(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
