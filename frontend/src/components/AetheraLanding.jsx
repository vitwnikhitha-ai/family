import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AetheraLanding() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-transparent text-black font-inter">
      {/* Content Layer */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {/* Navigation Bar */}
        <nav className="w-full">
          <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
            {/* Logo */}
            <div className="text-3xl tracking-tight font-instrument text-[#000000]">
              Aethera<sup className="text-sm">®</sup>
            </div>
            
            {/* Menu Items */}
            <div className="hidden md:flex items-center gap-8 text-sm">
              <a href="#home" className="text-[#000000] hover:text-black transition-colors">Home</a>
              <a href="#studio" className="text-[#6F6F6F] hover:text-black transition-colors">Studio</a>
              <a href="#about" className="text-[#6F6F6F] hover:text-black transition-colors">About</a>
              <a href="#journal" className="text-[#6F6F6F] hover:text-black transition-colors">Journal</a>
              <a href="#reach-us" className="text-[#6F6F6F] hover:text-black transition-colors">Reach Us</a>
            </div>

            {/* CTA */}
            <button 
              onClick={() => navigate('/login')}
              className="rounded-full px-6 py-2.5 text-sm bg-[#000000] text-white hover:scale-105 transition-transform"
            >
              Begin Journey
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <div 
          className="flex-grow flex flex-col items-center justify-center text-center px-6"
          style={{ paddingTop: 'calc(8rem - 75px)', paddingBottom: '10rem' }}
        >
          <h1 
            className="text-5xl sm:text-7xl md:text-8xl max-w-7xl font-normal font-instrument animate-fade-rise"
            style={{ lineHeight: 0.95, letterSpacing: '-2.46px', color: '#000000' }}
          >
            Beyond <em className="text-[#6F6F6F] not-italic">silence,</em> we build <em className="text-[#6F6F6F] not-italic">the eternal.</em>
          </h1>
          
          <p className="text-base sm:text-lg max-w-2xl mt-8 leading-relaxed text-[#6F6F6F] animate-fade-rise-delay">
            Building platforms for brilliant minds, fearless makers, and thoughtful souls. Through the noise, we craft digital havens for deep work and pure flows.
          </p>

          <button 
            onClick={() => navigate('/login')}
            className="rounded-full px-14 py-5 text-base mt-12 bg-[#000000] text-[#FFFFFF] hover:scale-105 transition-transform animate-fade-rise-delay-2"
          >
            Begin Journey
          </button>
        </div>
      </div>
    </div>
  );
}
