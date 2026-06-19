import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  UserPlus, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Shield,
  ShieldCheck,
  Database,
  Calendar,
  Clock,
  Search,
  Key,
  Activity,
  UserCheck
} from 'lucide-react';
import { useAuth, API_URL } from '../context/AuthContext';
import getProfileImage from '../utils/getProfileImage';

export default function Settings() {
  const { token, user, isAdmin, register } = useAuth();
  const [activeTab, setActiveTab] = useState('account');

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Administrative Register User state
  const [regData, setRegData] = useState({
    username: '',
    password: '',
    role: 'Family Member',
    memberProfileId: ''
  });
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState(null);
  const [regLoading, setRegLoading] = useState(false);
  
  // List of members to map profiles
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // Audit search state
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState('all');

  useEffect(() => {
    async function fetchMembers() {
      setMembersLoading(true);
      try {
        const response = await fetch(`${API_URL}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMembers(data.members || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setMembersLoading(false);
      }
    }
    fetchMembers();
  }, [token]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      const response = await fetch(`${API_URL}/auth/password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setPasswordSuccess(true);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        throw new Error(data.message || 'Failed to update credentials.');
      }
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    if (!regData.username || !regData.password) {
      setRegError('Username and password are required.');
      return;
    }

    setRegLoading(true);
    setRegError(null);
    setRegSuccess(false);

    try {
      await register(regData.username, regData.password, regData.role, regData.memberProfileId || null);
      setRegSuccess(true);
      setRegData({ username: '', password: '', role: 'Family Member', memberProfileId: '' });
    } catch (err) {
      setRegError(err.message || 'Failed to create user login.');
    } finally {
      setRegLoading(false);
    }
  };

  // Find linked profile if any
  const linkedProfile = members.find(m => m._id?.toString() === user?.memberProfile?.toString());

  // Static/Mock details for interactive Audit logs
  const auditLogs = [
    { id: 1, action: 'User login', user: user?.username || 'nikhil', target: 'Session Auth', category: 'security', date: 'Just now', icon: ShieldCheck, status: 'Success' },
    { id: 2, action: 'Created family record', user: 'nikhil', target: 'Praveen Maddali', category: 'genealogy', date: '2 hours ago', icon: UserPlus, status: 'Success' },
    { id: 3, action: 'Updated notes bio', user: 'nikhil', target: 'Swarna Kumari', category: 'genealogy', date: '1 day ago', icon: Activity, status: 'Success' },
    { id: 4, action: 'Uploaded birth certificate', user: 'nikhil', target: 'Nikhitha Vault', category: 'database', date: '2 days ago', icon: Database, status: 'Success' },
    { id: 5, action: 'Changed system security configurations', user: 'system', target: 'Mongoose Engine', category: 'database', date: '3 days ago', icon: Database, status: 'Success' },
    { id: 6, action: 'Admin password reset', user: 'admin', target: 'System Engine', category: 'security', date: '4 days ago', icon: Key, status: 'Success' }
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(auditSearch.toLowerCase()) || 
                          log.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          log.target.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesFilter = auditFilter === 'all' || log.category === auditFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-black tracking-tight">System Settings</h1>
        <p className="text-black/70 text-sm mt-1">Update personal settings, view roles, and handle administrative security.</p>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side Navigation Tabs */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-saas-card border border-saas-border rounded-2xl p-4 shadow-saas-card space-y-1">
            <h4 className="text-[10px] font-extrabold text-black/70 uppercase tracking-wider px-3 mb-2">General Settings</h4>
            
            {/* Account Tab */}
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'account' 
                  ? 'bg-gradient-to-r from-saas-primary/10 to-saas-accent/10 text-saas-primary border-l-2 border-saas-primary' 
                  : 'text-black/70 hover:bg-saas-bg hover:text-black'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile & Account</span>
            </button>

            {/* Security Tab */}
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'security' 
                  ? 'bg-gradient-to-r from-saas-primary/10 to-saas-accent/10 text-saas-primary border-l-2 border-saas-primary' 
                  : 'text-black/70 hover:bg-saas-bg hover:text-black'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Security & Password</span>
            </button>

            {/* User Access Tab (Admins Only) */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeTab === 'users' 
                    ? 'bg-gradient-to-r from-saas-primary/10 to-saas-accent/10 text-saas-primary border-l-2 border-saas-primary' 
                    : 'text-black/70 hover:bg-saas-bg hover:text-black'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>User Registrations</span>
              </button>
            )}

            {/* Audit Logs Tab */}
            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'logs' 
                  ? 'bg-gradient-to-r from-saas-primary/10 to-saas-accent/10 text-saas-primary border-l-2 border-saas-primary' 
                  : 'text-black/70 hover:bg-saas-bg hover:text-black'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Platform Audit Logs</span>
            </button>
          </div>
        </div>

        {/* Right Side Content Pane */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: PROFILE & ACCOUNT */}
          {activeTab === 'account' && (
            <div className="bg-saas-card border border-saas-border rounded-2xl p-6 shadow-saas-card space-y-6">
              <div className="flex items-center gap-3 border-b border-saas-border pb-4">
                <div className="w-10 h-10 rounded-xl bg-saas-primary/10 text-saas-primary flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-black text-base tracking-tight">Profile & Account</h3>
                  <p className="text-black/70 text-xs mt-0.5">Overview of your logged-in credentials and family profile link status.</p>
                </div>
              </div>

              {/* Account details card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] font-extrabold text-black/70 uppercase tracking-wider mb-1">Username</span>
                    <div className="px-4 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-xs font-bold text-black">
                      {user?.username}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-extrabold text-black/70 uppercase tracking-wider mb-1">System Privilege</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                        isAdmin 
                          ? 'bg-saas-primary/10 text-saas-primary border-saas-primary/20' 
                          : 'bg-saas-bg text-black/70 border-saas-border'
                      }`}>
                        {user?.role || (isAdmin ? 'Admin' : 'Family Member')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="block text-[10px] font-extrabold text-black/70 uppercase tracking-wider mb-1">Linked Genealogy Profile</span>
                  
                  {linkedProfile ? (
                    <div className="bg-saas-bg/40 border border-saas-border p-4 rounded-xl flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-saas-bg border border-saas-border overflow-hidden flex-shrink-0">
                        {getProfileImage(linkedProfile) ? (
                          <img 
                            src={getProfileImage(linkedProfile)} 
                            alt={linkedProfile.fullName} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-black/70">
                            {linkedProfile.fullName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-black">{linkedProfile.fullName}</h4>
                        <span className="text-[9px] font-black text-saas-primary uppercase tracking-wider block mt-0.5">{linkedProfile.relation}</span>
                        <span className="text-[10px] text-black/70 block mt-1">{linkedProfile.occupation || 'No job specified'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-saas-warning/10 border border-saas-warning/20 rounded-xl text-xs text-saas-warning flex gap-2.5 leading-normal">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">No linked profile binded</span>
                        <span className="text-[10px] opacity-90 block mt-0.5">Your user account isn't bound to any profile node in the family tree. Please ask an administrator to edit your user login settings.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY & CREDENTIALS */}
          {activeTab === 'security' && (
            <div className="bg-saas-card border border-saas-border rounded-2xl p-6 shadow-saas-card space-y-6">
              <div className="flex items-center gap-3 border-b border-saas-border pb-4">
                <div className="w-10 h-10 rounded-xl bg-saas-primary/10 text-saas-primary flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-black text-base tracking-tight">Security & Credentials</h3>
                  <p className="text-black/70 text-xs mt-0.5">Change your system login credentials here to ensure your account security.</p>
                </div>
              </div>

              {passwordSuccess && (
                <div className="p-4 bg-saas-success/10 border border-saas-success/20 text-saas-success rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5" />
                  <span>Password updated successfully.</span>
                </div>
              )}

              {passwordError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                
                {/* Current password */}
                <div>
                  <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Current Password</label>
                  <div className="relative">
                    <input 
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black placeholder-saas-text-secondary/60 font-mono"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3.5 text-black/70 hover:text-black"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">New Password</label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black placeholder-saas-text-secondary/60 font-mono"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3.5 text-black/70 hover:text-black"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm new password */}
                <div>
                  <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Confirm New Password</label>
                  <input 
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black placeholder-saas-text-secondary/60 font-mono"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-saas-primary to-saas-accent hover:opacity-95 text-black rounded-xl text-xs font-bold shadow-lg shadow-saas-primary/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {passwordLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />}
                  <span>Update Password</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: USER ACCESS REGISTRATIONS (ADMIN ONLY) */}
          {activeTab === 'users' && isAdmin && (
            <div className="bg-saas-card border border-saas-border rounded-2xl p-6 shadow-saas-card space-y-6">
              <div className="flex items-center gap-3 border-b border-saas-border pb-4">
                <div className="w-10 h-10 rounded-xl bg-saas-primary/10 text-saas-primary flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-black text-base tracking-tight">Register Family Login</h3>
                  <p className="text-black/70 text-xs mt-0.5">Create software access credentials and link them to family genealogy profile nodes.</p>
                </div>
              </div>

              {regSuccess && (
                <div className="p-4 bg-saas-success/10 border border-saas-success/20 text-saas-success rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5" />
                  <span>Login account successfully created.</span>
                </div>
              )}

              {regError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5" />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterUser} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Username</label>
                    <input 
                      type="text"
                      value={regData.username}
                      onChange={(e) => setRegData(prev => ({ ...prev, username: e.target.value }))}
                      required
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black placeholder-saas-text-secondary/60"
                      placeholder="Enter login username"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Password</label>
                    <input 
                      type="password"
                      value={regData.password}
                      onChange={(e) => setRegData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black placeholder-saas-text-secondary/60 font-mono"
                      placeholder="Enter initial password"
                    />
                  </div>

                  {/* System Role */}
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">System Role</label>
                    <select 
                      value={regData.role}
                      onChange={(e) => setRegData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black cursor-pointer"
                    >
                      <option value="Family Member">Family Member</option>
                      <option value="Admin">System Admin</option>
                    </select>
                  </div>

                  {/* Link Family Profile */}
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Link Family Profile</label>
                    <select 
                      value={regData.memberProfileId}
                      onChange={(e) => setRegData(prev => ({ ...prev, memberProfileId: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-saas-bg border border-saas-border rounded-xl text-sm focus:outline-none focus:border-saas-primary text-black cursor-pointer"
                    >
                      <option value="">-- No Link (Generic) --</option>
                      {members.map(m => (
                        <option key={m._id} value={m._id}>{m.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-saas-primary to-saas-accent hover:opacity-95 text-black rounded-xl text-xs font-bold shadow-lg shadow-saas-primary/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {regLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />}
                  <span>Create Account</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: PLATFORM AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-saas-card border border-saas-border rounded-2xl p-6 shadow-saas-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-saas-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-saas-primary/10 text-saas-primary flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-black text-base tracking-tight">Platform Audit Logs</h3>
                    <p className="text-black/70 text-xs mt-0.5">Real-time log of security events and database operations.</p>
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-saas-success animate-ping hidden sm:block mr-2" />
              </div>

              {/* Log Search and Filter Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-black/70" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-saas-bg border border-saas-border rounded-xl text-xs focus:outline-none focus:border-saas-primary text-black placeholder-saas-text-secondary/60"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-black/70 uppercase whitespace-nowrap">Filter:</span>
                  <select
                    value={auditFilter}
                    onChange={(e) => setAuditFilter(e.target.value)}
                    className="px-3 py-2 bg-saas-bg border border-saas-border rounded-xl text-xs text-black/70 focus:outline-none focus:border-saas-primary cursor-pointer"
                  >
                    <option value="all">All Logs</option>
                    <option value="security">Security</option>
                    <option value="genealogy">Genealogy</option>
                    <option value="database">Database</option>
                  </select>
                </div>
              </div>

              {/* Log Timeline list */}
              <div className="space-y-4">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map(log => (
                    <div key={log.id} className="flex gap-4 p-4.5 bg-saas-bg/40 border border-saas-border/60 rounded-2xl hover:border-saas-border transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-saas-bg border border-saas-border flex items-center justify-center text-black/70 flex-shrink-0">
                        <log.icon className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden flex-grow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <p className="text-xs text-black leading-tight font-bold">
                            <span className="text-saas-primary font-black">{log.user}</span> {log.action}
                          </p>
                          <span className="text-[9px] font-semibold text-black/70">{log.date}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] font-bold text-black/70 uppercase tracking-wider">Target: {log.target}</span>
                          <span className="w-1 h-1 rounded-full bg-saas-border" />
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            log.status === 'Success' ? 'bg-saas-success/10 text-saas-success' : 'bg-rose-500/10 text-rose-500'
                          }`}>{log.status}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-black/70/60 italic text-xs border border-dashed border-saas-border rounded-2xl">
                    No matching audit logs found.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
