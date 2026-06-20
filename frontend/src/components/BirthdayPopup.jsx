import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gift, Calendar, Heart, PartyPopper, Stars } from 'lucide-react';
import getProfileImage from '../utils/getProfileImage';

export default function BirthdayPopup({ nearestBday, onClose }) {
  if (!nearestBday) return null;

  const dob = new Date(nearestBday.dateOfBirth);
  const age = new Date().getFullYear() - dob.getFullYear();
  
  // Custom Confetti Component using framer-motion
  const Confetti = () => {
    const pieces = Array.from({ length: 40 });
    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '32px' }}>
        {pieces.map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: '50vw', y: '100%', 
              scale: Math.random() * 0.5 + 0.5,
              opacity: 1
            }}
            animate={{ 
              x: `${Math.random() * 200 - 50}%`,
              y: `${Math.random() * -150}%`,
              rotate: Math.random() * 360,
              opacity: [1, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 2 + 2.5,
              ease: "easeOut",
              delay: Math.random() * 0.5
            }}
            style={{
              position: 'absolute',
              width: '8px', height: '16px',
              backgroundColor: ['#FFD54F', '#FFB300', '#7C4DFF', '#38bdf8', '#fb7185'][Math.floor(Math.random() * 5)],
              borderRadius: '4px'
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}>
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{
          width: '90%', maxWidth: '550px',
          backgroundColor: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255, 213, 79, 0.3)',
          borderRadius: '32px',
          padding: '40px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 0 40px rgba(255,213,79,0.05)',
          position: 'relative', overflow: 'hidden'
        }}
      >
        <Confetti />
        
        {/* Floating Light Particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`light-${i}`}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 30 - 15, 0],
              opacity: [0.1, 0.6, 0.1]
            }}
            transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
            style={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: '4px', height: '4px',
              backgroundColor: '#FFD54F',
              borderRadius: '50%',
              boxShadow: '0 0 10px #FFD54F',
              pointerEvents: 'none'
            }}
          />
        ))}

        {/* Glass reflection sweep */}
        <motion.div 
          animate={{ x: ['-200%', '200%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
          style={{
            position: 'absolute', top: 0, left: 0, width: '150%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
            transform: 'skewX(-20deg)',
            pointerEvents: 'none'
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', zIndex: 10 }}>
          <PartyPopper size={32} color="#FFD54F" />
          <h2 style={{ fontSize: '28px', fontWeight: '900', background: 'linear-gradient(135deg, #FFD54F, #FFB300)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, letterSpacing: '0.02em', textShadow: '0 4px 20px rgba(255,213,79,0.3)' }}>
            Happy Birthday {nearestBday.fullName.split(' ')[0]}!
          </h2>
          <Stars size={32} color="#FFD54F" />
        </div>

        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', margin: '0 0 32px 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Today is {nearestBday.fullName.split(' ')[0]}'s special day!
        </p>

        {/* Profile Image with Golden Ring */}
        <div style={{ position: 'relative', marginBottom: '32px', zIndex: 10 }}>
          {/* Animated rings */}
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{ position: 'absolute', inset: '-12px', borderRadius: '50%', border: '2px dashed rgba(255,213,79,0.5)' }}
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            style={{ position: 'absolute', inset: '-24px', borderRadius: '50%', border: '1px solid rgba(124,77,255,0.3)' }}
          />
          
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden',
              border: '4px solid #FFD54F',
              boxShadow: '0 0 30px rgba(255,213,79,0.6), inset 0 0 20px rgba(0,0,0,0.5)',
              position: 'relative', zIndex: 2,
              backgroundColor: 'rgba(255,255,255,0.1)'
            }}
          >
            {getProfileImage(nearestBday) ? (
              <img src={getProfileImage(nearestBday)} alt={nearestBday.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>{nearestBday.fullName.charAt(0)}</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Details Row */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Calendar size={24} color="#7C4DFF" />
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>{nearestBday.dobStr.split(',')[0]}</span>
          </div>
          <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Gift size={24} color="#FFD54F" />
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>Turning {age}</span>
          </div>
          <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Heart size={24} color="#FFB300" />
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>Celebration</span>
          </div>
        </div>

        {/* Wishes Section */}
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '24px', width: '100%',
          border: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px', zIndex: 10
        }}>
          <Sparkles size={20} color="#FFD54F" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
            "May {nearestBday.fullName.split(' ')[0]}'s year be filled with happiness, <br/> health, success, and blessings."
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '16px', width: '100%', zIndex: 10 }}>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,213,79,0.6)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              flex: 1, padding: '16px', borderRadius: '16px', border: 'none',
              background: 'linear-gradient(135deg, #FFD54F, #FFB300)',
              color: '#000', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 10px 20px rgba(255,213,79,0.3)'
            }}
          >
            <PartyPopper size={20} /> Celebrate
          </motion.button>
        </div>

      </motion.div>
    </div>
  );
}
