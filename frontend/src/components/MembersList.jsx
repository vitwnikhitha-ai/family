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
import MemberProfile from './MemberProfile';
import { calculateRelation } from '../utils/relationCalculator';
import getProfileImage from '../utils/getProfileImage';

export default function MembersList() {
  const { token, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const profileId = searchParams.get('profileId');
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

            setPhotoPreview(data.profilePhoto ? (data.profilePhoto.startsWith('/uploads/') ? `http://localhost:5000${data.profilePhoto}` : data.profilePhoto) : '');
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
      setFormPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
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

      const bodyData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'children') {
          bodyData.append(key, JSON.stringify(formData[key]));
        } else {
          bodyData.append(key, formData[key] || '');
        }
      });

      if (formPhoto) {
        bodyData.append('profilePhoto', formPhoto);
      }

      // Append privacy settings
      bodyData.append('privacySettings_dateOfBirth', privacySettings.dateOfBirth ? 'Private' : 'Public');
      bodyData.append('privacySettings_phoneNumber', privacySettings.phoneNumber ? 'Private' : 'Public');
      bodyData.append('privacySettings_aadhaarNumber', privacySettings.aadhaarNumber ? 'Private' : 'Public');
      bodyData.append('privacySettings_address', privacySettings.address ? 'Private' : 'Public');
      bodyData.append('privacySettings_occupation', privacySettings.occupation ? 'Private' : 'Public');
      bodyData.append('customFields', JSON.stringify(customFields.filter(f => f.key.trim() && f.value.trim())));

      const isEdit = actionParam === 'edit';
      const url = isEdit ? `${API_URL}/members/${editIdParam}` : `${API_URL}/members`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: bodyData
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
          <h1 className="text-3xl font-black text-saas-text-primary tracking-tight">
            Family Members
          </h1>
          <p className="text-saas-text-secondary text-sm mt-1">View, manage, and edit details of all family members in the Maddali registry.</p>
        </div>
        
      </div>

      {/* Filters & Search Row */}
      <div className="bg-saas-card p-5 rounded-2xl border border-saas-border shadow-saas-card flex flex-col md:flex-row md:items-center gap-4">
        
        {/* Search */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 w-4 h-4 text-saas-text-secondary" />
          <input 
            type="text"
            placeholder="Search by name, job, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary focus:bg-saas-card transition-all text-saas-text-primary placeholder-saas-text-secondary/60"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Gender */}
          <select 
            value={genderFilter} 
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-xs text-saas-text-secondary focus:outline-none focus:border-saas-primary focus:bg-saas-card transition-all cursor-pointer"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          {/* Relation */}
          <select 
            value={relationFilter} 
            onChange={(e) => setRelationFilter(e.target.value)}
            className="px-3 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-xs text-saas-text-secondary focus:outline-none focus:border-saas-primary focus:bg-saas-card transition-all cursor-pointer"
          >
            <option value="">All Relations</option>
            <option value="Self">Self</option>
            <option value="Father">Father</option>
            <option value="Mother">Mother</option>
            <option value="Spouse">Spouse</option>
            <option value="Son">Son</option>
            <option value="Daughter">Daughter</option>
            <option value="Brother">Brother</option>
            <option value="Sister">Sister</option>
          </select>

          {/* Marital Status */}
          <select 
            value={maritalFilter} 
            onChange={(e) => setMaritalFilter(e.target.value)}
            className="px-3 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-xs text-saas-text-secondary focus:outline-none focus:border-saas-primary focus:bg-saas-card transition-all cursor-pointer"
          >
            <option value="">All Marital Statuses</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
          
        </div>
      </div>

      {/* Modern Grid Directory */}
      <div className="mt-6">
        {loading ? (
          <div className="bg-saas-card rounded-2xl border border-saas-border p-12 text-center text-saas-text-secondary space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-saas-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading family records...</p>
          </div>
        ) : error ? (
          <div className="bg-saas-card rounded-2xl border border-saas-border p-12 text-center text-rose-500">
            <Info className="w-8 h-8 mx-auto mb-2 text-rose-400" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-saas-card rounded-2xl border border-saas-border p-16 text-center text-saas-text-secondary">
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-saas-text-secondary opacity-60" />
            <p className="text-sm font-semibold">No family members found.</p>
            <p className="text-xs mt-1">Try resetting filters or adding new members.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.map((member) => (
              <div 
                key={member._id} 
                className="bg-saas-card border border-saas-border rounded-3xl p-6 hover:border-saas-primary/50 transition-all shadow-saas-card group relative flex flex-col hover:-translate-y-1 hover:shadow-2xl hover:shadow-saas-primary/5"
              >
                {/* Header: Photo and Info */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-saas-bg border-2 border-saas-border overflow-hidden flex-shrink-0 relative">
                    {getProfileImage(member) ? (
                      <img 
                        src={getProfileImage(member)} 
                        alt={member.fullName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-xl text-saas-text-secondary">
                        {member.fullName.charAt(0)}
                      </div>
                    )}
                    {member.maritalStatus === 'Married' && (
                      <div className="absolute -bottom-1 -right-1 bg-rose-500 rounded-full p-1 border-2 border-saas-card" title="Married">
                        <Heart className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <h3 className="font-extrabold text-lg text-saas-text-primary truncate" title={member.fullName}>
                      {member.fullName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                        {member.computedRelation || member.relation}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${member.gender === 'Male' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'}`}>
                        {member.gender}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body info */}
                <div className="space-y-3.5 mb-6 text-xs text-saas-text-secondary flex-grow">
                  
                  {/* Phone */}
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-saas-bg border border-saas-border flex items-center justify-center flex-shrink-0 text-saas-primary">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    {member.isPhonePrivate ? (
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Lock className={`w-3.5 h-3.5 flex-shrink-0 ${member._id === user?.memberProfile ? 'text-saas-warning' : 'text-slate-500'}`} />
                        <span className="italic truncate">{member._id === user?.memberProfile ? member.phoneNumber : 'Hidden'}</span>
                      </div>
                    ) : (
                      <span className="truncate text-saas-text-primary font-medium">{member.phoneNumber}</span>
                    )}
                  </div>

                  {/* DOB */}
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-saas-bg border border-saas-border flex items-center justify-center flex-shrink-0 text-saas-primary">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    {member.isDobPrivate ? (
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Lock className={`w-3.5 h-3.5 flex-shrink-0 ${member._id === user?.memberProfile ? 'text-saas-warning' : 'text-slate-500'}`} />
                        <span className="italic truncate">{member._id === user?.memberProfile ? (member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : '-') : 'Hidden'}</span>
                      </div>
                    ) : (
                      <span className="truncate text-saas-text-primary font-medium">{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : '-'}</span>
                    )}
                  </div>

                  {/* Occupation */}
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-saas-bg border border-saas-border flex items-center justify-center flex-shrink-0 text-saas-primary">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    {member.isOccupationPrivate ? (
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Lock className={`w-3.5 h-3.5 flex-shrink-0 ${member._id === user?.memberProfile ? 'text-saas-warning' : 'text-slate-500'}`} />
                        <span className="italic truncate">{member._id === user?.memberProfile ? member.occupation : 'Hidden'}</span>
                      </div>
                    ) : (
                      <span className="truncate text-saas-text-primary font-medium">{member.occupation}</span>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-saas-bg border border-saas-border flex items-center justify-center flex-shrink-0 text-saas-primary">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    {member.isAddressPrivate ? (
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Lock className={`w-3.5 h-3.5 flex-shrink-0 ${member._id === user?.memberProfile ? 'text-saas-warning' : 'text-slate-500'}`} />
                        <span className="italic truncate">{member._id === user?.memberProfile ? member.address : 'Hidden'}</span>
                      </div>
                    ) : (
                      <span className="truncate text-saas-text-primary font-medium">{member.address}</span>
                    )}
                  </div>

                  {/* Custom Fields block */}
                  {member.customFields && member.customFields.length > 0 && (
                    <div className="pt-3 mt-3 border-t border-saas-border/40 flex flex-wrap gap-2">
                      {member.customFields.map((field, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-saas-bg px-2.5 py-1.5 rounded-lg text-[10px] border border-saas-border shadow-sm max-w-full">
                          <span className="font-bold text-saas-text-secondary truncate">{field.key}:</span>
                          <span className="font-extrabold text-saas-text-primary truncate">
                            {field.isPrivate && member._id !== user?.memberProfile ? (
                              <Lock className="w-2.5 h-2.5 inline text-slate-500" />
                            ) : field.value}
                          </span>
                          {field.isPrivate && member._id === user?.memberProfile && (
                            <Lock className="w-2.5 h-2.5 text-saas-warning ml-0.5" title="Private" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-saas-border flex items-center justify-between gap-2 mt-auto">
                  <button 
                    onClick={() => navigate(`/members?profileId=${member._id}`)}
                    className="flex-1 py-2.5 rounded-xl bg-saas-primary text-white hover:bg-opacity-90 shadow-md shadow-saas-primary/20 transition-all font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  
                  {user && (member._id?.toString() === user.memberProfile?.toString() || member.createdBy?.toString() === user.id?.toString()) && (
                    <>
                      <button 
                        onClick={() => navigate(`/members?action=edit&id=${member._id}`)}
                        className="p-2.5 rounded-xl bg-saas-bg hover:bg-saas-primary/10 text-saas-text-secondary hover:text-saas-primary border border-saas-border hover:border-saas-primary/20 transition-all"
                        title="Edit Member"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(member._id, member.fullName)}
                        className="p-2.5 rounded-xl bg-saas-bg hover:bg-rose-500/10 text-saas-text-secondary hover:text-rose-500 border border-saas-border hover:border-rose-500/20 transition-all"
                        title="Delete Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
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
                  <h3 className="font-extrabold text-saas-text-primary text-lg tracking-tight">
                    {actionParam === 'edit' ? 'Edit Family Member' : 'Add Family Member'}
                  </h3>
                  <p className="text-saas-text-secondary text-xs mt-1">Fill out the detailed family relationship and personal records.</p>
                </div>
                <button 
                  onClick={() => navigate('/members')}
                  className="p-2.5 rounded-xl hover:bg-saas-bg text-saas-text-secondary hover:text-saas-text-primary border border-saas-border transition-all cursor-pointer"
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
                    <label className="block text-xs font-bold text-saas-text-primary uppercase tracking-wider mb-1">Full Name</label>
                    <input 
                      type="text" 
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-saas-text-primary placeholder-saas-text-secondary/60"
                      placeholder="e.g. Ramesh Kumar"
                    />
                  </div>

                  {/* Relation */}
                  <div>
                    <label className="block text-xs font-bold text-saas-text-primary uppercase tracking-wider mb-1">Relation to Self</label>
                    <select 
                      name="relation"
                      value={formData.relation}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-saas-text-primary cursor-pointer"
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
                    <label className="block text-xs font-bold text-saas-text-primary uppercase tracking-wider mb-1">Gender</label>
                    <select 
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-saas-text-primary cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* DOB */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-saas-text-primary uppercase tracking-wider">Date of Birth</label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={privacySettings.dateOfBirth} 
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, dateOfBirth: e.target.checked }))}
                          className="w-3.5 h-3.5 text-saas-primary border-saas-border rounded focus:ring-saas-primary"
                        />
                        <span className="text-[10px] text-saas-text-secondary font-bold uppercase tracking-wider">Private</span>
                      </label>
                    </div>
                    <input 
                      type="date" 
                      name="dateOfBirth"
                      required
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-saas-text-primary"
                    />
                  </div>

                  {/* Marital Status */}
                  <div>
                    <label className="block text-xs font-bold text-saas-text-primary uppercase tracking-wider mb-1">Marital Status</label>
                    <select 
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-saas-text-primary cursor-pointer"
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
                      <label className="block text-xs font-bold text-saas-text-primary uppercase tracking-wider">Phone Number</label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={privacySettings.phoneNumber} 
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, phoneNumber: e.target.checked }))}
                          className="w-3.5 h-3.5 text-saas-primary border-saas-border rounded focus:ring-saas-primary"
                        />
                        <span className="text-[10px] text-saas-text-secondary font-bold uppercase tracking-wider">Private</span>
                      </label>
                    </div>
                    <input 
                      type="tel" 
                      name="phoneNumber"
                      required
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-saas-text-primary placeholder-saas-text-secondary/60"
                      placeholder="10-digit number"
                    />
                  </div>

                  {/* Aadhaar Number */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-saas-text-primary uppercase tracking-wider">Aadhaar (Secure)</label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={privacySettings.aadhaarNumber} 
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, aadhaarNumber: e.target.checked }))}
                          className="w-3.5 h-3.5 text-saas-primary border-saas-border rounded focus:ring-saas-primary"
                        />
                        <span className="text-[10px] text-saas-text-secondary font-bold uppercase tracking-wider">Private</span>
                      </label>
                    </div>
                    <input 
                      type="text" 
                      name="aadhaarNumber"
                      required
                      value={formData.aadhaarNumber}
                      onChange={handleInputChange}
                      maxLength={12}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm font-mono focus:outline-none focus:border-saas-primary text-saas-text-primary placeholder-saas-text-secondary/60"
                      placeholder="12-digit UID"
                    />
                  </div>

                  {/* Occupation */}
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-saas-text-primary uppercase tracking-wider">Occupation</label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={privacySettings.occupation} 
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, occupation: e.target.checked }))}
                          className="w-3.5 h-3.5 text-saas-primary border-saas-border rounded focus:ring-saas-primary"
                        />
                        <span className="text-[10px] text-saas-text-secondary font-bold uppercase tracking-wider">Private</span>
                      </label>
                    </div>
                    <input 
                      type="text" 
                      name="occupation"
                      required
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-saas-text-primary placeholder-saas-text-secondary/60"
                      placeholder="e.g. Engineer, Business, Homemaker"
                    />
                  </div>

                  {/* Address */}
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-saas-text-primary uppercase tracking-wider">Address</label>
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={privacySettings.address} 
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, address: e.target.checked }))}
                          className="w-3.5 h-3.5 text-saas-primary border-saas-border rounded focus:ring-saas-primary"
                        />
                        <span className="text-[10px] text-saas-text-secondary font-bold uppercase tracking-wider">Private</span>
                      </label>
                    </div>
                    <textarea 
                      name="address"
                      required
                      rows={2}
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-saas-text-primary placeholder-saas-text-secondary/60"
                      placeholder="Full residential address"
                    />
                  </div>
                </div>

                {/* Custom Key-Value Fields */}
                <div className="border-t border-saas-border pt-4 mt-2 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-saas-text-primary text-xs uppercase tracking-wider">Custom Fields</h4>
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
                              className="w-full px-2.5 py-1.5 bg-saas-bg border border-saas-border rounded-lg text-xs focus:outline-none focus:border-saas-primary text-saas-text-primary placeholder-saas-text-secondary/60"
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
                              className="w-full px-2.5 py-1.5 bg-saas-bg border border-saas-border rounded-lg text-xs focus:outline-none focus:border-saas-primary text-saas-text-primary placeholder-saas-text-secondary/60"
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
                            <span className="text-[9px] text-saas-text-secondary font-bold uppercase whitespace-nowrap">Private</span>
                          </label>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              setCustomFields(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1.5 rounded-lg text-saas-text-secondary hover:text-rose-500 hover:bg-saas-bg border border-transparent hover:border-saas-border transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-saas-text-secondary/60 italic leading-normal">No custom fields added yet. Click "Add Field" to attach extra data (e.g. Blood Group, PAN Card, Passport).</p>
                  )}
                </div>

                {/* Relationship Links */}
                <div className="border-t border-saas-border pt-4 mt-2 space-y-3">
                  <h4 className="font-extrabold text-saas-text-primary text-xs uppercase tracking-wider">Relationship Connections</h4>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Father */}
                    <div>
                      <label className="block text-xs font-bold text-saas-text-primary uppercase tracking-wider mb-1">Father</label>
                      <select 
                        name="father"
                        value={formData.father}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-saas-text-primary cursor-pointer"
                      >
                        <option value="">-- Select Father --</option>
                        {possibleFathers.map(f => (
                          <option key={f._id} value={f._id}>{f.fullName}</option>
                        ))}
                      </select>
                    </div>

                    {/* Mother */}
                    <div>
                      <label className="block text-xs font-bold text-saas-text-primary uppercase tracking-wider mb-1">Mother</label>
                      <select 
                        name="mother"
                        value={formData.mother}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-saas-text-primary cursor-pointer"
                      >
                        <option value="">-- Select Mother --</option>
                        {possibleMothers.map(m => (
                          <option key={m._id} value={m._id}>{m.fullName}</option>
                        ))}
                      </select>
                    </div>

                    {/* Spouse */}
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-saas-text-primary uppercase tracking-wider mb-1">Spouse</label>
                      <select 
                        name="spouse"
                        value={formData.spouse}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-saas-text-primary cursor-pointer"
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
                  className="px-4 py-2 border border-saas-border rounded-xl text-xs font-bold text-saas-text-secondary hover:bg-saas-bg hover:text-saas-text-primary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-saas-primary to-saas-accent hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-saas-primary/10 transition-all cursor-pointer flex items-center gap-2"
                >
                  {formLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />}
                  <span>{actionParam === 'edit' ? 'Update Member' : 'Save Member'}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Details View (Member Profile Modal/Overlay) */}
      <AnimatePresence>
        {profileId && (
          <MemberProfile 
            memberId={profileId} 
            onClose={() => navigate('/members')} 
            onEdit={(id) => navigate(`/members?action=edit&id=${id}`)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
