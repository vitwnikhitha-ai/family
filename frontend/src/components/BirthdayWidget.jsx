import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth, API_URL } from '../context/AuthContext';
import getProfileImage from '../utils/getProfileImage';
import MemberProfile from './MemberProfile';
import BirthdayPopup from './BirthdayPopup';
import { Cake } from 'lucide-react';

export default function BirthdayWidget() {
  const { token } = useAuth();
  const location = useLocation();
  const [members, setMembers] = useState([]);
  const [nearestBday, setNearestBday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Show popup whenever the user goes to the dashboard and today is the birthday
    if (nearestBday && nearestBday.daysLeft === 0 && location.pathname === '/dashboard') {
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  }, [nearestBday, location.pathname]);

  const closePopup = () => {
    setShowPopup(false);
  };

  useEffect(() => {
    async function fetchMembers() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMembers(data.members || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, [token]);

  useEffect(() => {
    if (members.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const birthdays = members
      .filter(m => m.dateOfBirth && !m.isDobPrivate)
      .map(m => {
        const dob = new Date(m.dateOfBirth);
        const nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        
        if (nextBday < today) {
          nextBday.setFullYear(today.getFullYear() + 1);
        }
        
        const diffTime = nextBday.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          ...m,
          daysLeft,
          nextBdayDate: nextBday,
          dobStr: dob.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    if (birthdays.length > 0) {
      setNearestBday(birthdays[0]);
    }
  }, [members]);

  if (loading || !nearestBday) return null;
  if (nearestBday.daysLeft > 30) return null;

  const isToday = nearestBday.daysLeft === 0;
  const isSoon = nearestBday.daysLeft > 0 && nearestBday.daysLeft <= 7;

  // Render Widget Content
  const WidgetContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'center', padding: '0 4px' }}>
      {!isToday && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', paddingLeft: '4px' }}>
          <span style={{ fontSize: '10px' }}>🎂</span>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Birthday</span>
          {isSoon && (
            <span style={{ marginLeft: 'auto', fontSize: '8px', padding: '2px 6px', borderRadius: '6px', backgroundColor: 'rgba(8,145,178,0.1)', color: 'rgb(8,145,178)', border: '1px solid rgba(8,145,178,0.2)', whiteSpace: 'nowrap' }}>
              Soon
            </span>
          )}
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          {getProfileImage(nearestBday) ? (
            <img src={getProfileImage(nearestBday)} alt={nearestBday.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontWeight: 'bold', color: 'black', fontSize: '14px' }}>{nearestBday.fullName.charAt(0)}</span>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          {isToday ? (
            <>
              <span style={{ fontSize: '12px', fontWeight: '900', color: 'rgb(202,138,4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.025em' }}>🎉 Birthday Today!</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'black', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Wish {nearestBday.fullName.split(' ')[0]}</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'black', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nearestBday.fullName}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'rgba(0,0,0,0.6)', marginTop: '2px' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nearestBday.dobStr.split(',')[0]}</span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.2)', flexShrink: 0 }} />
                <span style={{ fontWeight: 'bold', color: 'rgb(2,132,199)', flexShrink: 0 }}>⏳ {nearestBday.daysLeft}d</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Big Birthday Popup Modal */}
      <AnimatePresence>
        {showPopup && nearestBday && (
          <BirthdayPopup nearestBday={nearestBday} onClose={closePopup} />
        )}
      </AnimatePresence>

      {!isMobile ? (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            boxShadow: isToday 
              ? ['0 8px 32px rgba(0,0,0,0.1)', '0 0 40px rgba(250,204,21,0.6)', '0 8px 32px rgba(0,0,0,0.1)']
              : isSoon 
              ? ['0 8px 32px rgba(0,0,0,0.1)', '0 0 30px rgba(34,211,238,0.5)', '0 8px 32px rgba(0,0,0,0.1)']
              : '0 8px 32px rgba(0,0,0,0.1)'
          }}
          transition={{
            boxShadow: {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }
          }}
          style={{
            position: 'fixed',
            top: '17px',
            right: '24px',
            width: '220px',
            height: '65px',
            overflow: 'hidden',
            backgroundColor: isToday ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${isToday ? 'rgba(250,204,21,0.4)' : isSoon ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: '16px',
            zIndex: 9999,
            display: 'flex'
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top right, rgba(255,255,255,0.05), transparent)', pointerEvents: 'none', borderRadius: '16px' }} />
          <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />
          <WidgetContent />
        </motion.div>
      ) : (
        <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 9999 }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              boxShadow: isToday 
                ? ['0 8px 32px rgba(0,0,0,0.15)', '0 0 30px rgba(250,204,21,0.6)', '0 8px 32px rgba(0,0,0,0.15)']
                : isSoon 
                ? ['0 8px 32px rgba(0,0,0,0.15)', '0 0 25px rgba(34,211,238,0.5)', '0 8px 32px rgba(0,0,0,0.15)']
                : '0 8px 32px rgba(0,0,0,0.15)'
            }}
            transition={{ boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
            style={{
              width: '200px', height: '65px', padding: '0px 0px',
              backgroundColor: isToday ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${isToday ? 'rgba(250,204,21,0.5)' : isSoon ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.15)'}`, 
              borderRadius: '16px', overflow: 'hidden'
            }}
          >
             <WidgetContent />
          </motion.div>
        </div>
      )}

    </>
  );
}
