import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  User,
  Heart, 
  FileText, 
  Calendar, 
  Activity, 
  TrendingUp, 
  UserPlus, 
  Cake, 
  ChevronRight,
  ArrowRight,
  Shield
} from 'lucide-react';
import { useAuth, API_URL } from '../context/AuthContext';
import { calculateRelation } from '../utils/relationCalculator';
import MemberProfile from './MemberProfile';
import getProfileImage from '../utils/getProfileImage';

export default function Dashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch(`${API_URL}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const mappedMembers = data.members.map(m => ({
            ...m,
            computedRelation: calculateRelation(m, data.members, user?.memberProfile)
          }));
          setMembers(mappedMembers);
        } else {
          setError('Failed to fetch dashboard metrics.');
        }
      } catch (err) {
        console.error(err);
        setError('Connection failure.');
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, [token, user]);
  // Calculations
  const totalMembers = members.length;
  const maleCount = members.filter(m => m.gender === 'Male').length;
  const femaleCount = members.filter(m => m.gender === 'Female').length;
  const marriedCount = members.filter(m => m.maritalStatus === 'Married').length;
  const marriageRate = totalMembers ? Math.round((marriedCount / totalMembers) * 100) : 0;


  // Dynamic upcoming birthdays calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const birthdays = members
    .filter(m => m.dateOfBirth && !m.isDobPrivate)
    .map(m => {
      const dob = new Date(m.dateOfBirth);
      // Create next birthday date
      const nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      // If birthday already passed this year, set it to next year
      if (nextBday < today) {
        nextBday.setFullYear(today.getFullYear() + 1);
      }
      const diffTime = Math.abs(nextBday - today);
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        name: m.fullName,
        date: dob.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        relation: m.computedRelation || m.relation,
        daysLeft,
        member: m
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);



  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-saas-text-primary tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-saas-primary to-saas-accent">{user?.username || 'Guest'}</span>
          </h1>
          <p className="text-saas-text-secondary text-sm mt-1">Here is a summary of your family registry and lineage visualization status.</p>
        </div>

        {/* Quick Action */}
        <button 
          onClick={() => navigate('/tree')}
          className="flex items-center gap-2 bg-gradient-to-r from-saas-primary to-saas-accent hover:opacity-95 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-saas-primary/10 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <span>Open Interactive Tree</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Analytics Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Members */}
        <div className="bg-saas-card border border-saas-border p-6 rounded-2xl shadow-saas-card relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-saas-text-secondary uppercase tracking-wider">Total Members</span>
            <div className="w-8 h-8 rounded-lg bg-saas-primary/10 text-saas-primary flex items-center justify-center">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-3xl font-black text-saas-text-primary">{totalMembers}</span>
            <span className="text-[10px] font-bold text-saas-success flex items-center gap-0.5 bg-saas-success/10 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>+12%</span>
            </span>
          </div>
          <p className="text-[10px] text-saas-text-secondary mt-1">Active registered family nodes</p>
        </div>

        {/* Gender Distribution */}
        <div className="bg-saas-card border border-saas-border p-6 rounded-2xl shadow-saas-card relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-saas-text-secondary uppercase tracking-wider">Gender Split</span>
            <div className="w-8 h-8 rounded-lg bg-saas-accent/10 text-saas-accent flex items-center justify-center">
              <UserPlus className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold text-saas-text-primary mb-1">
              <span>M: {maleCount}</span>
              <span>F: {femaleCount}</span>
            </div>
            {/* Split Progress Bar */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                className="bg-saas-primary" 
                style={{ width: `${totalMembers ? (maleCount / totalMembers) * 100 : 50}%` }} 
              />
              <div 
                className="bg-saas-accent" 
                style={{ width: `${totalMembers ? (femaleCount / totalMembers) * 100 : 50}%` }} 
              />
            </div>
          </div>
          <p className="text-[10px] text-saas-text-secondary">Blue: Male | Purple: Female</p>
        </div>

        {/* Marriage Ratio */}
        <div className="bg-saas-card border border-saas-border p-6 rounded-2xl shadow-saas-card relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-saas-text-secondary uppercase tracking-wider">Marriage Ratio</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 fill-rose-500/10" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-3xl font-black text-saas-text-primary">{marriageRate}%</span>
            <span className="text-[10px] font-bold text-saas-text-secondary">({marriedCount} Married)</span>
          </div>
          <p className="text-[10px] text-saas-text-secondary mt-1">Of total family members list</p>
        </div>

        {/* Documents Vault */}
        <div className="bg-saas-card border border-saas-border p-6 rounded-2xl shadow-saas-card relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-saas-text-secondary uppercase tracking-wider">Vault Files</span>
            <div className="w-8 h-8 rounded-lg bg-saas-warning/10 text-saas-warning flex items-center justify-center">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-3xl font-black text-saas-text-primary">0</span>
            <span className="text-[10px] font-bold text-saas-text-secondary">Secured Certificates</span>
          </div>
          <p className="text-[10px] text-saas-text-secondary mt-1">Aadhaar/Passports stored securely</p>
        </div>

      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upcoming Birthdays widget */}
        <div className="bg-saas-card border border-saas-border p-6 rounded-3xl shadow-saas-card space-y-4">
          <div className="flex items-center justify-between border-b border-saas-border pb-3">
            <div className="flex items-center gap-2">
              <Cake className="w-4.5 h-4.5 text-saas-accent" />
              <h3 className="font-extrabold text-sm text-saas-text-primary uppercase tracking-wide">Birthdays</h3>
            </div>
            <span className="text-[10px] font-bold text-saas-text-secondary">Upcoming</span>
          </div>

          <div className="divide-y divide-saas-border">
            {birthdays.map((bday, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-saas-primary/10 to-saas-accent/10 flex items-center justify-center font-bold text-xs text-saas-primary overflow-hidden">
                    {getProfileImage(bday.member) ? (
                      <img src={getProfileImage(bday.member)} alt={bday.name} className="w-full h-full object-cover" />
                    ) : (
                      bday.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-saas-text-primary leading-tight">{bday.name}</h4>
                    <span className="text-[9px] font-bold text-saas-text-secondary uppercase tracking-wider block mt-0.5">{bday.relation}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-saas-text-primary">{bday.date}</span>
                  <span className="text-[9px] font-bold text-saas-accent block mt-0.5">{bday.daysLeft} days left</span>
                </div>
              </div>
            ))}
          </div>
        </div>



      </div>

      {/* Details Dialog */}
      <AnimatePresence>
        {selectedMemberId && (
          <MemberProfile 
            memberId={selectedMemberId} 
            onClose={() => setSelectedMemberId(null)} 
            onEdit={(id) => {
              setSelectedMemberId(null);
              navigate(`/members?action=edit&id=${id}`);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
