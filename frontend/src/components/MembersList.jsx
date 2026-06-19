import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Eye, 
  X, 
  Upload, 
  Info,
  Calendar,
  Phone,
  FileSpreadsheet,
  Lock,
  ChevronDown,
  MapPin,
  Briefcase,
  Heart,
  EyeOff
} from 'lucide-react';
import { useAuth, API_URL } from '../context/AuthContext';
import { calculateRelation } from '../utils/relationCalculator';
import getProfileImage from '../utils/getProfileImage';

export default function MembersList() {
  const { token, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const actionParam = searchParams.get('action'); // 'add' or 'edit'
  const editIdParam = searchParams.get('id');

  // State lists
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [relationFilter, setRelationFilter] = useState('');
  const [maritalFilter, setMaritalFilter] = useState('');

  // Form State
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formPhoto, setFormPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [privacySettings, setPrivacySettings] = useState({
    dateOfBirth: false,
    phoneNumber: false,
    aadhaarNumber: true,
    address: false,
    occupation: false
  });
  const [formData, setFormData] = useState({
    fullName: '',
    relation: 'Self',
    gender: 'Male',
    dateOfBirth: '',
    phoneNumber: '',
    aadhaarNumber: '',
    address: '',
    occupation: '',
    maritalStatus: 'Single',
    father: '',
    mother: '',
    spouse: '',
    children: []
  });
  const [customFields, setCustomFields] = useState([]);

  // Fetch list of members
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const rawMembers = data.members;
        const mappedMembers = rawMembers.map(m => ({
          ...m,
          computedRelation: calculateRelation(m, rawMembers, user?.memberProfile)
        }));
        setMembers(mappedMembers);
      } else {
        const errData = await response.json();
        setError(errData.message || 'Failed to fetch members');
      }
    } catch (err) {
      console.error('Fetch members error:', err);
      setError('Connection failure to API server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [token]);

  // Handle member edit loading
  useEffect(() => {
    if (actionParam === 'edit' && editIdParam) {
      // Fetch fresh profile with decrypted Aadhaar
      const fetchEditProfile = async () => {
        try {
          const response = await fetch(`${API_URL}/members/${editIdParam}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setFormData({
              fullName: data.fullName || '',
              relation: data.relation || 'Self',
              gender: data.gender || 'Male',
              dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().substring(0, 10) : '',
              phoneNumber: data.phoneNumber || '',
              aadhaarNumber: data.aadhaarNumber || '',
              address: data.address || '',
              occupation: data.occupation || '',
              maritalStatus: data.maritalStatus || 'Single',
              father: data.father?._id || data.father || '',
              mother: data.mother?._id || data.mother || '',
              spouse: data.spouse?._id || data.spouse || '',
              children: data.children?.map(c => c._id || c) || []
            });

            const privacy = data.privacySettings || {};
            setPrivacySettings({
              dateOfBirth: privacy.dateOfBirth === 'Private',
              phoneNumber: privacy.phoneNumber === 'Private',
              aadhaarNumber: privacy.aadhaarNumber === 'Private',
              address: privacy.address === 'Private',
              occupation: privacy.occupation === 'Private'
            });

            setPhotoPreview(data.profilePhoto ? (data.profilePhoto.startsWith('/uploads/') ? `${import.meta.env.MODE === 'production' ? '' : 'http://localhost:5000'}${data.profilePhoto}` : data.profilePhoto) : '');
            setCustomFields(data.customFields || []);
          }
        } catch (e) {
          console.error('Failed to load edit profile', e);
        }
      };
      fetchEditProfile();
    } else {
      // Reset form data for add
      setFormData({
        fullName: '',
        relation: 'Self',
        gender: 'Male',
        dateOfBirth: '',
        phoneNumber: '',
        aadhaarNumber: '',
        address: '',
        occupation: '',
        maritalStatus: 'Single',
        father: '',
        mother: '',
        spouse: '',
        children: []
      });
      setPrivacySettings({
        dateOfBirth: false,
        phoneNumber: false,
        aadhaarNumber: true,
        address: false,
        occupation: false
      });
      setPhotoPreview('');
      setFormPhoto(null);
      setCustomFields([]);
    }
  }, [actionParam, editIdParam, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhoto(reader.result); // Base64 string
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      // Validate Aadhaar (12 digits)
      const cleanAadhaar = formData.aadhaarNumber.replace(/\s+/g, '');
      if (cleanAadhaar && cleanAadhaar.length !== 12) {
        throw new Error('Aadhaar number must be exactly 12 digits');
      }

      // Use JSON instead of FormData for Base64 support
      const bodyData = {
        ...formData,
        privacySettings_dateOfBirth: privacySettings.dateOfBirth ? 'Private' : 'Public',
        privacySettings_phoneNumber: privacySettings.phoneNumber ? 'Private' : 'Public',
        privacySettings_aadhaarNumber: privacySettings.aadhaarNumber ? 'Private' : 'Public',
        privacySettings_address: privacySettings.address ? 'Private' : 'Public',
        privacySettings_occupation: privacySettings.occupation ? 'Private' : 'Public',
        customFields: JSON.stringify(customFields.filter(f => f.key.trim() && f.value.trim())),
      };

      if (formPhoto) {
        bodyData.profilePhoto = formPhoto; // Send base64 string directly
      }

      const isEdit = actionParam === 'edit';
      const url = isEdit ? `${API_URL}/members/${editIdParam}` : `${API_URL}/members`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save member details.');
      }

      // Close panel and refresh
      navigate('/members');
      fetchMembers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (memberId, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This will clear all linked relationship paths.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchMembers();
      } else {
        const errData = await response.json();
        alert(errData.message || 'Failed to delete member.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting member.');
    }
  };

  // Perform search & filters on client side for responsive instant filter
  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.occupation.toLowerCase().includes(search.toLowerCase()) ||
      m.address.toLowerCase().includes(search.toLowerCase());

    const matchesGender = !genderFilter || m.gender === genderFilter;
    const matchesRelation = !relationFilter || m.computedRelation === relationFilter || m.relation === relationFilter;
    const matchesMarital = !maritalFilter || m.maritalStatus === maritalFilter;

    return matchesSearch && matchesGender && matchesRelation && matchesMarital;
  });

  // Lists for dropdown linking
  const possibleFathers = members.filter(m => m.gender === 'Male' && m._id !== editIdParam);
  const possibleMothers = members.filter(m => m.gender === 'Female' && m._id !== editIdParam);
  const possibleSpouses = members.filter(m => m._id !== editIdParam);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight">
            Family Members
          </h1>
          <p className="text-black/70 text-sm mt-1">View, manage, and edit details of all family members in the Maddali registry.</p>
        </div>
        
      </div>

      {/* Floating Glass Toolbar for Search & Filters */}
      <div className="bg-white/[0.02] backdrop-blur-3xl p-3 md:p-4 rounded-3xl md:rounded-full border border-white/10 shadow-saas-card flex flex-col md:flex-row md:items-center gap-4">
        
        {/* Search */}
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
          <input 
            type="text"
            placeholder="Search by name, job, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-full text-sm focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all text-black placeholder-white/40"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 justify-center">
          
          <select 
            value={genderFilter} 
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-full text-xs text-black/70 focus:outline-none focus:border-white/30 focus:text-black transition-all cursor-pointer appearance-none text-center min-w-[100px]"
          >
            <option value="" className="bg-black text-black">All Genders</option>
            <option value="Male" className="bg-black text-black">Male</option>
            <option value="Female" className="bg-black text-black">Female</option>
            <option value="Other" className="bg-black text-black">Other</option>
          </select>

          <select 
            value={relationFilter} 
            onChange={(e) => setRelationFilter(e.target.value)}
            className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-full text-xs text-black/70 focus:outline-none focus:border-white/30 focus:text-black transition-all cursor-pointer appearance-none text-center min-w-[110px]"
          >
            <option value="" className="bg-black text-black">All Relations</option>
            <option value="Self" className="bg-black text-black">Self</option>
            <option value="Father" className="bg-black text-black">Father</option>
            <option value="Mother" className="bg-black text-black">Mother</option>
            <option value="Spouse" className="bg-black text-black">Spouse</option>
            <option value="Son" className="bg-black text-black">Son</option>
            <option value="Daughter" className="bg-black text-black">Daughter</option>
            <option value="Brother" className="bg-black text-black">Brother</option>
            <option value="Sister" className="bg-black text-black">Sister</option>
          </select>

          <select 
            value={maritalFilter} 
            onChange={(e) => setMaritalFilter(e.target.value)}
            className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-full text-xs text-black/70 focus:outline-none focus:border-white/30 focus:text-black transition-all cursor-pointer appearance-none text-center min-w-[110px]"
          >
            <option value="" className="bg-black text-black">All Statuses</option>
            <option value="Single" className="bg-black text-black">Single</option>
            <option value="Married" className="bg-black text-black">Married</option>
            <option value="Divorced" className="bg-black text-black">Divorced</option>
            <option value="Widowed" className="bg-black text-black">Widowed</option>
          </select>
          
        </div>
      </div>

      {/* Modern Grid Directory */}
      <div className="mt-6">
        {loading ? (
          <div className="bg-saas-card rounded-2xl border border-saas-border p-12 text-center text-black/70 space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-saas-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading family records...</p>
          </div>
        ) : error ? (
          <div className="bg-saas-card rounded-2xl border border-saas-border p-12 text-center text-rose-500">
            <Info className="w-8 h-8 mx-auto mb-2 text-rose-400" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-saas-card rounded-2xl border border-saas-border p-16 text-center text-black/70">
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-black/70 opacity-60" />
            <p className="text-sm font-semibold">No family members found.</p>
            <p className="text-xs mt-1">Try resetting filters or adding new members.</p>
          </div>
        ) : (
          <div 
            className="grid gap-6 w-full"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {filteredMembers.map((member) => (
              <div 
                key={member._id} 
                className="w-full max-w-[320px] mx-auto bg-white/[0.02] border border-white/10 rounded-[24px] p-6 backdrop-blur-3xl hover:border-white/30 transition-all duration-500 shadow-saas-card group relative flex flex-col items-center hover:-translate-y-2 hover:shadow-2xl h-[400px]"
              >
                {/* Delete / Edit Actions (Absolute Top Corners) */}
                {user && (member._id?.toString() === user.memberProfile?.toString() || member.createdBy?.toString() === user.id?.toString()) && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                      onClick={() => navigate(`/members?action=edit&id=${member._id}`)}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/20 text-black/50 hover:text-black transition-all"
                      title="Edit Member"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(member._id, member.fullName)}
                      className="p-2 rounded-full bg-white/5 hover:bg-rose-500/20 text-black/50 hover:text-rose-400 transition-all"
                      title="Delete Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Top: Avatar */}
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 relative mb-3 flex items-center justify-center">
                  {getProfileImage(member) ? (
                    <img 
                      src={getProfileImage(member)} 
                      alt={member.fullName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-2xl text-black/50">
                      {member.fullName.charAt(0)}
                    </span>
                  )}
                  {member.maritalStatus === 'Married' && (
                    <div className="absolute bottom-[-2px] right-[-2px] bg-rose-500 rounded-full p-1 border-2 border-transparent" title="Married">
                      <Heart className="w-2.5 h-2.5 text-black fill-white" />
                    </div>
                  )}
                </div>
                
                {/* Center: Name & Badges */}
                <div className="text-center w-full mb-5">
                  <h3 className="font-bold text-lg text-black tracking-wide truncate px-2" title={member.fullName}>
                    {member.fullName}
                  </h3>
                  <div className="flex flex-wrap justify-center items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-black/80 border border-white/10 uppercase tracking-widest">
                      {member.computedRelation || member.relation}
                    </span>
                  </div>
                </div>

                {/* Middle: Details List */}
                <div className="w-full space-y-3 text-[13px] text-black/70 mb-5 flex-grow flex flex-col justify-center">
                  
                  {/* Phone */}
                  <div className="flex items-center gap-3 px-2">
                    <Phone className="w-3.5 h-3.5 text-black/50 flex-shrink-0" />
                    {member.isPhonePrivate ? (
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Lock className={`w-3.5 h-3.5 flex-shrink-0 ${member._id === user?.memberProfile ? 'text-black/70' : 'text-black/30'}`} />
                        <span className="italic truncate">{member._id === user?.memberProfile ? member.phoneNumber : 'Hidden'}</span>
                      </div>
                    ) : (
                      <span className="truncate font-medium">{member.phoneNumber || '-'}</span>
                    )}
                  </div>

                  {/* DOB */}
                  <div className="flex items-center gap-3 px-2">
                    <Calendar className="w-3.5 h-3.5 text-black/50 flex-shrink-0" />
                    {member.isDobPrivate ? (
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Lock className={`w-3.5 h-3.5 flex-shrink-0 ${member._id === user?.memberProfile ? 'text-black/70' : 'text-black/30'}`} />
                        <span className="italic truncate">{member._id === user?.memberProfile ? (member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : '-') : 'Hidden'}</span>
                      </div>
                    ) : (
                      <span className="truncate font-medium">{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : '-'}</span>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-3.5 h-3.5 flex items-center justify-center text-black/50 flex-shrink-0 font-bold text-[10px] border border-white/50 rounded-full">G</div>
                    <span className="truncate font-medium">{member.gender || '-'}</span>
                  </div>

                </div>

                {/* Bottom: View Details Button */}
                <div className="w-full mt-auto">
                  <button 
                    onClick={() => navigate(`/profile/${member._id}`)}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-black transition-all font-semibold text-[13px] flex items-center justify-center gap-2 group-hover:border-white/30"
                  >
                    <Eye className="w-4 h-4 opacity-70" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overlay Slide-over Modal for Add/Edit Member */}
      <AnimatePresence>
        {(actionParam === 'add' || actionParam === 'edit') && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => navigate('/members')}
              className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-saas-card border-l border-saas-border shadow-2xl flex flex-col justify-between"
            >
              {/* Form Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-saas-border">
                <div>
                  <h3 className="font-extrabold text-black text-lg tracking-tight">
                    {actionParam === 'edit' ? 'Edit Family Member' : 'Add Family Member'}
                  </h3>
                  <p className="text-black/70 text-xs mt-1">Fill out the detailed family relationship and personal records.</p>
                </div>
                <button 
                  onClick={() => navigate('/members')}
                  className="p-2.5 rounded-xl hover:bg-saas-bg text-black/70 hover:text-black border border-saas-border transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto px-6 py-6 space-y-5">
                {formError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-500 flex items-start gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Full Name</label>
                    <input 
                      type="text" 
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black placeholder-saas-text-secondary/60"
                      placeholder="e.g. Ramesh Kumar"
                    />
                  </div>

                  {/* Relation */}
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Relation to Self</label>
                    <select 
                      name="relation"
                      value={formData.relation}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black cursor-pointer"
                    >
                      <option value="Self">Self (Root)</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                    </select>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Gender</label>
                    <select 
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* DOB */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-black uppercase tracking-wider">Date of Birth</label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={privacySettings.dateOfBirth} 
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, dateOfBirth: e.target.checked }))}
                          className="w-3.5 h-3.5 text-saas-primary border-saas-border rounded focus:ring-saas-primary"
                        />
                        <span className="text-[10px] text-black/70 font-bold uppercase tracking-wider">Private</span>
                      </label>
                    </div>
                    <input 
                      type="date" 
                      name="dateOfBirth"
                      required
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black"
                    />
                  </div>

                  {/* Marital Status */}
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Marital Status</label>
                    <select 
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black cursor-pointer"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-black uppercase tracking-wider">Phone Number</label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={privacySettings.phoneNumber} 
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, phoneNumber: e.target.checked }))}
                          className="w-3.5 h-3.5 text-saas-primary border-saas-border rounded focus:ring-saas-primary"
                        />
                        <span className="text-[10px] text-black/70 font-bold uppercase tracking-wider">Private</span>
                      </label>
                    </div>
                    <input 
                      type="tel" 
                      name="phoneNumber"
                      required
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black placeholder-saas-text-secondary/60"
                      placeholder="10-digit number"
                    />
                  </div>

                  {/* Aadhaar Number */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-black uppercase tracking-wider">Aadhaar (Secure)</label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={privacySettings.aadhaarNumber} 
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, aadhaarNumber: e.target.checked }))}
                          className="w-3.5 h-3.5 text-saas-primary border-saas-border rounded focus:ring-saas-primary"
                        />
                        <span className="text-[10px] text-black/70 font-bold uppercase tracking-wider">Private</span>
                      </label>
                    </div>
                    <input 
                      type="text" 
                      name="aadhaarNumber"
                      required
                      value={formData.aadhaarNumber}
                      onChange={handleInputChange}
                      maxLength={12}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm font-mono focus:outline-none focus:border-saas-primary text-black placeholder-saas-text-secondary/60"
                      placeholder="12-digit UID"
                    />
                  </div>

                  {/* Occupation */}
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-black uppercase tracking-wider">Occupation</label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={privacySettings.occupation} 
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, occupation: e.target.checked }))}
                          className="w-3.5 h-3.5 text-saas-primary border-saas-border rounded focus:ring-saas-primary"
                        />
                        <span className="text-[10px] text-black/70 font-bold uppercase tracking-wider">Private</span>
                      </label>
                    </div>
                    <input 
                      type="text" 
                      name="occupation"
                      required
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black placeholder-saas-text-secondary/60"
                      placeholder="e.g. Engineer, Business, Homemaker"
                    />
                  </div>

                  {/* Address */}
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-black uppercase tracking-wider">Address</label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={privacySettings.address} 
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, address: e.target.checked }))}
                          className="w-3.5 h-3.5 text-saas-primary border-saas-border rounded focus:ring-saas-primary"
                        />
                        <span className="text-[10px] text-black/70 font-bold uppercase tracking-wider">Private</span>
                      </label>
                    </div>
                    <textarea 
                      name="address"
                      required
                      rows={2}
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black placeholder-saas-text-secondary/60"
                      placeholder="Full residential address"
                    />
                  </div>
                </div>

                {/* Custom Key-Value Fields */}
                <div className="border-t border-saas-border pt-4 mt-2 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-black text-xs uppercase tracking-wider">Custom Fields</h4>
                    <button
                      type="button"
                      onClick={() => setCustomFields(prev => [...prev, { key: '', value: '', privacy: 'Public' }])}
                      className="px-3 py-1.5 bg-saas-primary/10 hover:bg-saas-primary/20 text-saas-primary text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Field</span>
                    </button>
                  </div>

                  {customFields.length > 0 ? (
                    <div className="space-y-3">
                      {customFields.map((field, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-saas-bg/40 p-3 rounded-xl border border-saas-border">
                          {/* Key */}
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Label (e.g. Blood Group)"
                              value={field.key}
                              onChange={(e) => {
                                const newFields = [...customFields];
                                newFields[idx].key = e.target.value;
                                setCustomFields(newFields);
                              }}
                              className="w-full px-2.5 py-1.5 bg-saas-bg border border-saas-border rounded-lg text-xs focus:outline-none focus:border-saas-primary text-black placeholder-saas-text-secondary/60"
                            />
                          </div>

                          {/* Value */}
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Value (e.g. O+)"
                              value={field.value}
                              onChange={(e) => {
                                const newFields = [...customFields];
                                newFields[idx].value = e.target.value;
                                setCustomFields(newFields);
                              }}
                              className="w-full px-2.5 py-1.5 bg-saas-bg border border-saas-border rounded-lg text-xs focus:outline-none focus:border-saas-primary text-black placeholder-saas-text-secondary/60"
                            />
                          </div>

                          {/* Privacy check */}
                          <label className="flex items-center gap-1 cursor-pointer select-none px-1">
                            <input
                              type="checkbox"
                              checked={field.privacy === 'Private'}
                              onChange={(e) => {
                                const newFields = [...customFields];
                                newFields[idx].privacy = e.target.checked ? 'Private' : 'Public';
                                setCustomFields(newFields);
                              }}
                              className="w-3.5 h-3.5 text-saas-primary border-saas-border rounded focus:ring-saas-primary"
                            />
                            <span className="text-[9px] text-black/70 font-bold uppercase whitespace-nowrap">Private</span>
                          </label>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              setCustomFields(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1.5 rounded-lg text-black/70 hover:text-rose-500 hover:bg-saas-bg border border-transparent hover:border-saas-border transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-black/70/60 italic leading-normal">No custom fields added yet. Click "Add Field" to attach extra data (e.g. Blood Group, PAN Card, Passport).</p>
                  )}
                </div>

                {/* Relationship Links */}
                <div className="border-t border-saas-border pt-4 mt-2 space-y-3">
                  <h4 className="font-extrabold text-black text-xs uppercase tracking-wider">Relationship Connections</h4>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Father */}
                    <div>
                      <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Father</label>
                      <select 
                        name="father"
                        value={formData.father}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black cursor-pointer"
                      >
                        <option value="">-- Select Father --</option>
                        {possibleFathers.map(f => (
                          <option key={f._id} value={f._id}>{f.fullName}</option>
                        ))}
                      </select>
                    </div>

                    {/* Mother */}
                    <div>
                      <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Mother</label>
                      <select 
                        name="mother"
                        value={formData.mother}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black cursor-pointer"
                      >
                        <option value="">-- Select Mother --</option>
                        {possibleMothers.map(m => (
                          <option key={m._id} value={m._id}>{m.fullName}</option>
                        ))}
                      </select>
                    </div>

                    {/* Spouse */}
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Spouse</label>
                      <select 
                        name="spouse"
                        value={formData.spouse}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black cursor-pointer"
                      >
                        <option value="">-- Select Spouse (if married) --</option>
                        {possibleSpouses.map(s => (
                          <option key={s._id} value={s._id}>{s.fullName} ({s.gender})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </form>

              {/* Form Footer */}
              <div className="border-t border-saas-border px-6 py-4 flex items-center justify-end gap-3 bg-saas-bg/30">
                <button 
                  type="button"
                  onClick={() => navigate('/members')}
                  className="px-4 py-2 border border-saas-border rounded-xl text-xs font-bold text-black/70 hover:bg-saas-bg hover:text-black transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-saas-primary to-saas-accent hover:opacity-95 text-black rounded-xl text-xs font-bold shadow-lg shadow-saas-primary/10 transition-all cursor-pointer flex items-center gap-2"
                >
                  {formLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />}
                  <span>{actionParam === 'edit' ? 'Update Member' : 'Save Member'}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
