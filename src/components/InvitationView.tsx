import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getInvitationBySlug, getEventConfig, saveInvitation } from '../store';
import type { Invitation, EventConfig } from '../types';

type Phase = 'loading' | 'envelope' | 'reveal' | 'ready';

export default function InvitationView() {
  const { slug } = useParams<{ slug: string }>();
  const [phase, setPhase] = useState<Phase>('loading');
  const [loadProgress, setLoadProgress] = useState(0);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  // RSVP state
  const [rsvpStatus, setRsvpStatus] = useState<'pending' | 'confirmed' | 'declined'>('pending');
  const [rsvpGuests, setRsvpGuests] = useState(1);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [rsvpDiet, setRsvpDiet] = useState('');
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  // Interactive state
  const [genderRevealed, setGenderRevealed] = useState(false);
  const [genderParticles, setGenderParticles] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([]);
  const [nameVotes, setNameVotes] = useState<Record<string, number>>({ Sofía: 24, Valentina: 18, Isabella: 15, Camila: 12 });
  const [userVoted, setUserVoted] = useState<string | null>(null);
  const [wishes, setWishes] = useState<Array<{ name: string; message: string; time: string }>>([
    { name: 'Abuela Rosa', message: '¡No puedo esperar para conocer a mi nieta! Los amo mucho ❤️', time: 'Hace 2 días' },
    { name: 'Tía Carmen', message: 'Será la bebé más bonita del mundo, como su mamá 💕', time: 'Hace 3 días' },
    { name: 'Prima Laura', message: '¡Felicidades primos! Estoy muy feliz para ustedes 🎀', time: 'Hace 5 días' },
  ]);
  const [newWish, setNewWish] = useState('');
  const [newWishName, setNewWishName] = useState('');
  const [balloonsPopped, setBalloonsPopped] = useState<Set<number>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);

  // PHASE 1: Loading
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loadProgress >= 100) {
      const t = setTimeout(() => setPhase('envelope'), 300);
      return () => clearTimeout(t);
    }
  }, [loadProgress]);

  // Load data
  useEffect(() => {
    try {
      const c = getEventConfig();
      setConfig(c);
      if (slug) {
        const inv = getInvitationBySlug(slug);
        if (inv) {
          setInvitation(inv);
          setRsvpStatus(inv.status || 'pending');
          setRsvpGuests(inv.plusOnes || 1);
        } else {
          setNotFound(true);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Error cargando datos');
    }
  }, [slug]);

  // PHASE 2: Envelope → Reveal
  useEffect(() => {
    if (phase === 'envelope') {
      const t = setTimeout(() => setPhase('reveal'), 4000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // PHASE 3: Reveal → Ready
  useEffect(() => {
    if (phase === 'reveal') {
      const t = setTimeout(() => {
        setPhase('ready');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Scroll reveal
  useEffect(() => {
    if (phase !== 'ready') return;
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('sr-visible'); }); },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.sr').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [phase]);

  // RSVP submit
  const handleRSVP = useCallback(() => {
    if (!invitation) return;
    const updated: Invitation = {
      ...invitation,
      status: rsvpStatus,
      plusOnes: rsvpGuests,
      rsvpResponse: {
        attending: rsvpStatus === 'confirmed',
        plusOnesCount: rsvpGuests,
        message: rsvpMessage,
        dietaryRestrictions: rsvpDiet,
        respondedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    saveInvitation(updated);
    setInvitation(updated);
    setRsvpSubmitted(true);
    if (rsvpStatus === 'confirmed') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [invitation, rsvpStatus, rsvpGuests, rsvpDiet, rsvpMessage]);

  // Vote
  const handleVote = useCallback((name: string) => {
    if (userVoted) return;
    setNameVotes(prev => ({ ...prev, [name]: (prev[name] || 0) + 1 }));
    setUserVoted(name);
  }, [userVoted]);

  // Add wish
  const handleAddWish = useCallback(() => {
    if (!newWish.trim() || !newWishName.trim()) return;
    const w = { name: newWishName, message: newWish, time: 'Justo ahora' };
    setWishes(prev => [w, ...prev]);
    setNewWish('');
    setNewWishName('');
  }, [newWish, newWishName]);

  // Pop balloon
  const popBalloon = useCallback((i: number) => {
    setBalloonsPopped(prev => new Set(prev).add(i));
  }, []);

  // Gender reveal
  const handleGenderReveal = useCallback(() => {
    setGenderRevealed(true);
    const particles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 300 - 150,
      y: Math.random() * 300 - 150,
      emoji: ['💖', '🎀', '✨', '🌸', '💕', '🦋', '💐', '🌟'][i % 8],
    }));
    setGenderParticles(particles);
  }, []);

  // Countdown
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const calc = () => {
      const eventDate = config?.eventDate ? new Date(config.eventDate + 'T15:00:00') : new Date('2025-08-16T15:00:00');
      const diff = eventDate.getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      };
    };
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [config]);

  // Helpers
  const parentNames = config?.parentNames || 'María & Carlos';
  const [parent1, parent2] = parentNames.split(' & ');
  const eventDate = config?.eventDate || '2025-08-16';
  const dateObj = new Date(eventDate + 'T15:00:00');
  const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const eventTime = config?.eventTime || '3:00 PM';
  const schedule = config?.schedule || [
    { time: '3:00 PM', event: 'Recepción', icon: '🥂', desc: 'Bienvenida y registro' },
    { time: '3:30 PM', event: 'Juegos', icon: '🎮', desc: 'Juegos de baby shower' },
    { time: '4:30 PM', event: 'Merienda', icon: '🧁', desc: 'Snacks y postres' },
    { time: '5:00 PM', event: 'Regalos', icon: '🎁', desc: 'Apertura de regalos' },
    { time: '5:30 PM', event: 'Foto Grupal', icon: '📸', desc: 'Capturando recuerdos' },
  ];
  const gifts = [
    { emoji: '🧸', name: 'Peluches', price: '$' },
    { emoji: '👶', name: 'Ropa de bebé', price: '$$' },
    { emoji: '🍼', name: 'Biberones', price: '$' },
    { emoji: '🛁', name: 'Kit de baño', price: '$$' },
    { emoji: '📚', name: 'Libros infantiles', price: '$' },
    { emoji: '🧷', name: 'Pañales', price: '$' },
    { emoji: '🎵', name: 'Móvil musical', price: '$$' },
    { emoji: '👶', name: 'Mantas suaves', price: '$' },
  ];
  const balloonMessages = [
    '¡Felicidades! 💕', '¡Eres especial! ⭐', '¡Bienvenido bebé! 🍼',
    '¡Bendiciones! 🙏', '¡Amor infinito! 💖', '¡La mejor familia! 👨‍👩‍👧'
  ];
  const tips = [
    { front: '😴', back: 'Duerme cuando el bebé duerme. Las siestas son sagradas.' },
    { front: '🤱', back: 'Confía en tu instinto. Tú sabes qué es mejor.' },
    { front: '📱', back: 'Toma miles de fotos. Los bebés crecen muy rápido.' },
    { front: '🤗', back: 'Acepta ayuda. No tienes que hacerlo todo sola.' },
    { front: '💕', back: 'Disfruta cada momento. Hasta los llantos son pasajeros.' },
    { front: '🧘', back: 'Tómate tiempo para ti. Mamá feliz = bebé feliz.' },
  ];
  const babySizeWeek = 28;
  const fruits: Record<number, { emoji: string; name: string; size: string }> = {
    8: { emoji: '🫐', name: 'Arándano', size: '1.6 cm' },
    12: { emoji: '🍋', name: 'Limón', size: '5.4 cm' },
    16: { emoji: '🥑', name: 'Aguacate', size: '11.6 cm' },
    20: { emoji: '🍌', name: 'Plátano', size: '16.4 cm' },
    24: { emoji: '🌽', name: 'Elote', size: '21 cm' },
    28: { emoji: '🍆', name: 'Berenjena', size: '25 cm' },
    32: { emoji: '🥥', name: 'Coco', size: '28 cm' },
    36: { emoji: '🍉', name: 'Sandía', size: '33 cm' },
    40: { emoji: '🎃', name: 'Calabaza', size: '36 cm' },
  };

  // ============================================
  // RENDER: ERROR
  // ============================================
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f8' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#be185d', marginBottom: 8 }}>Error</h2>
          <p style={{ color: '#6b7280' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 12, background: '#ec4899', color: 'white', border: 'none', cursor: 'pointer', fontSize: 16 }}>Recargar</button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: NOT FOUND
  // ============================================
  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fef2f8, #faf5ff, #eff6ff)' }}>
        <div style={{ textAlign: 'center', padding: 40, maxWidth: 500 }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>💌</div>
          <h2 style={{ color: '#be185d', fontSize: 28, marginBottom: 12, fontFamily: 'Georgia, serif' }}>Invitación no encontrada</h2>
          <p style={{ color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>No encontramos una invitación con este enlace.</p>
          <button onClick={() => { localStorage.clear(); window.location.href = '#/'; }}
            style={{ padding: '12px 32px', borderRadius: 16, background: 'linear-gradient(135deg, #ec4899, #a855f7)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600, boxShadow: '0 4px 15px rgba(236,72,153,0.4)' }}>
            🔄 Regenerar Datos Demo
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (phase === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fef2f8, #faf5ff, #eff6ff)' }}>
        <div style={{ fontSize: 72, animation: 'babyBounce 1s ease-in-out infinite', marginBottom: 24 }}>🍼</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{ fontSize: 28, animation: `heartBeat 1.2s ease-in-out ${i * 0.3}s infinite`, display: 'inline-block' }}>💖</span>
          ))}
        </div>
        <p style={{ color: '#a855f7', fontSize: 18, fontWeight: 600, marginBottom: 20, fontFamily: 'Georgia, serif' }}>Preparando tu invitación...</p>
        <div style={{ width: 240, height: 6, borderRadius: 3, background: '#f3e8ff', overflow: 'hidden' }}>
          <div style={{ width: `${loadProgress}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #ec4899, #a855f7, #ec4899)', backgroundSize: '200% 100%', transition: 'width 0.1s', animation: 'shimmerMove 2s linear infinite' }} />
        </div>
        <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 10 }}>{loadProgress}%</p>
      </div>
    );
  }

  // ============================================
  // RENDER: ENVELOPE (Foldable Card)
  // ============================================
  if (phase === 'envelope') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95)', padding: 20, position: 'relative', overflow: 'hidden'
      }}>
        {[...Array(15)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', width: 4 + Math.random() * 6, height: 4 + Math.random() * 6,
            borderRadius: '50%', background: `rgba(236,72,153,${0.2 + Math.random() * 0.3})`,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            animation: `particleFloat ${5 + Math.random() * 10}s ease-in-out infinite`, animationDelay: `${Math.random() * 5}s`
          }} />
        ))}

        <div style={{ width: 320, height: 440, position: 'relative', perspective: '1200px', animation: 'cardEntrance 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
          {/* Card Inner */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 24,
            background: 'linear-gradient(135deg, #fff7ed, #fef3c7, #fce7f3)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 40, textAlign: 'center', zIndex: 1
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎀</div>
            <h2 style={{ fontSize: 20, color: '#be185d', fontFamily: 'Georgia, serif', marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Estás Invitado</h2>
            <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg, #ec4899, #a855f7)', margin: '12px auto' }} />
            <h1 style={{ fontSize: 32, color: '#1e1b4b', fontWeight: 800, marginBottom: 12 }}>{invitation?.guestName} {invitation?.guestLastName}</h1>
            <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, maxWidth: 220 }}>
              {invitation?.customMessage || `Te invitamos a celebrar la llegada de nuestro bebé`}
            </p>
            <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg, #a855f7, #ec4899)', margin: '16px auto' }} />
            <p style={{ color: '#7c3aed', fontSize: 14, fontWeight: 600, fontFamily: 'Georgia, serif' }}>{parent1} & {parent2}</p>
          </div>

          {/* Card Cover */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 24, zIndex: 2,
            transformStyle: 'preserve-3d', transformOrigin: 'top center',
            animation: 'coverFlip 1.8s 1.5s cubic-bezier(0.4,0,0.2,1) forwards',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 24, backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #ec4899, #d946ef, #a855f7)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, border: '3px solid rgba(255,255,255,0.3)', margin: 12 }} />
              <div style={{ fontSize: 18, position: 'absolute', top: 20, left: 20, opacity: 0.6 }}>⭐</div>
              <div style={{ fontSize: 18, position: 'absolute', top: 20, right: 20, opacity: 0.6 }}>⭐</div>
              <div style={{ fontSize: 60, marginBottom: 20, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>🍼</div>
              <h1 style={{ color: 'white', fontSize: 36, fontWeight: 800, fontFamily: 'Georgia, serif', textShadow: '0 2px 10px rgba(0,0,0,0.2)', letterSpacing: 2 }}>Baby Shower</h1>
              <div style={{ width: 80, height: 2, background: 'rgba(255,255,255,0.6)', margin: '16px auto' }} />
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, fontFamily: 'Georgia, serif' }}>{parent1} & {parent2}</p>
              <div style={{ fontSize: 18, position: 'absolute', bottom: 20, left: 20, opacity: 0.6 }}>🎀</div>
              <div style={{ fontSize: 18, position: 'absolute', bottom: 20, right: 20, opacity: 0.6 }}>🧸</div>
            </div>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 24, transform: 'rotateX(180deg)', backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #f0abfc, #e879f9, #d946ef)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: 64, opacity: 0.5 }}>🧸</span>
            </div>
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginTop: 40, fontFamily: 'Georgia, serif', animation: 'fadeInUp 0.5s 2.5s both' }}>
          ✨ Abriendo tu invitación... ✨
        </p>
      </div>
    );
  }

  // ============================================
  // RENDER: REVEAL
  // ============================================
  if (phase === 'reveal') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95)', animation: 'fadeOut 1s ease-out forwards' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 100, animation: 'bounceIn 0.6s ease-out' }}>🎉</div>
          <h1 style={{ color: 'white', fontSize: 36, fontWeight: 800, fontFamily: 'Georgia, serif', animation: 'fadeInUp 0.5s 0.2s both' }}>
            ¡Hola {invitation?.guestName}!
          </h1>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: READY - MAIN INVITATION
  // ============================================
  return (
    <div style={{ minHeight: '100vh', background: '#fefcfd' }}>
      {/* CONFETTI */}
      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
          {['🎀', '🍼', '⭐', '💖', '🧸', '☁️', '🌸', '💎', '🦋', '🌺', '✨', '🎈', '💕', '🎀', '🌟', '💐'].map((emoji, i) => (
            <span key={i} style={{ position: 'absolute', top: -40, left: `${(i * 6.25) % 100}%`, fontSize: 24 + Math.random() * 16, animation: `confettiFall ${2.5 + Math.random() * 2}s ${Math.random() * 1}s ease-out forwards` }}>{emoji}</span>
          ))}
        </div>
      )}

      {/* ========== HERO ========== */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #fff1f5, #fce7f3, #f3e8ff, #ede9fe, #e0f2fe)',
        position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '40px 20px'
      }}>
        {['🧸', '🎈', '⭐', '☁️', '🎀', '🍼', '🌟', '💕'].map((emoji, i) => (
          <span key={i} style={{
            position: 'absolute', fontSize: 24 + Math.random() * 20, opacity: 0.25,
            left: `${5 + i * 12}%`, top: `${10 + (i % 3) * 30}%`,
            animation: `float ${4 + i * 0.5}s ease-in-out infinite`, animationDelay: `${i * 0.7}s`
          }}>{emoji}</span>
        ))}

        {/* Top teddy bears and balloons */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
          <span style={{ fontSize: 60, animation: 'float 3s ease-in-out infinite' }}>🧸</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {['#ec4899', '#a855f7', '#f472b6', '#c084fc', '#ec4899'].map((color, i) => (
              <div key={i} style={{ animation: `float ${2 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}>
                <svg width="36" height="44" viewBox="0 0 36 44">
                  <ellipse cx="18" cy="16" rx="14" ry="16" fill={color} opacity="0.85" />
                  <circle cx="8" cy="4" r="4" fill={color} opacity="0.7" />
                  <circle cx="28" cy="4" r="4" fill={color} opacity="0.7" />
                  <line x1="18" y1="32" x2="18" y2="44" stroke="#9ca3af" strokeWidth="1" strokeDasharray="2 2" />
                </svg>
              </div>
            ))}
          </div>
          <span style={{ fontSize: 50, animation: 'float 3.5s ease-in-out infinite', animationDelay: '0.5s' }}>🧸</span>
        </div>

        <p style={{ color: '#a855f7', fontSize: 14, letterSpacing: 6, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>✨ Estás cordialmente invitado ✨</p>

        <h1 style={{ fontSize: 'clamp(48px, 10vw, 80px)', fontWeight: 800, color: '#1e1b4b', fontFamily: 'Georgia, serif', lineHeight: 1.1, marginBottom: 8, textShadow: '0 2px 20px rgba(168,85,247,0.15)' }}>Baby Shower</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '16px 0' }}>
          <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, transparent, #d946ef)' }} />
          <span style={{ fontSize: 28 }}>🍼</span>
          <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, #d946ef, transparent)' }} />
        </div>

        <h2 style={{ fontSize: 'clamp(24px, 5vw, 36px)', color: '#be185d', fontFamily: 'Georgia, serif', fontWeight: 600, marginBottom: 24 }}>{parent1} & {parent2}</h2>

        <div style={{ background: 'white', borderRadius: 24, padding: '24px 48px', boxShadow: '0 8px 32px rgba(236,72,153,0.12)', border: '2px solid #fce7f3', maxWidth: 400 }}>
          <p style={{ color: '#a855f7', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>Para</p>
          <h3 style={{ fontSize: 28, color: '#1e1b4b', fontWeight: 700, fontFamily: 'Georgia, serif' }}>{invitation?.guestName} {invitation?.guestLastName}</h3>
          {invitation?.tableNumber && <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>🪑 Mesa {invitation.tableNumber}</p>}
        </div>

        {invitation?.customMessage && (
          <p style={{ color: '#6b7280', fontSize: 15, marginTop: 20, maxWidth: 360, fontStyle: 'italic', lineHeight: 1.6 }}>"{invitation.customMessage}"</p>
        )}

        <div style={{ position: 'absolute', bottom: 30, animation: 'bounce 2s ease-in-out infinite' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#a855f7', fontSize: 13 }}>Desliza</span>
            <span style={{ fontSize: 20 }}>👇</span>
          </div>
        </div>
      </section>

      {/* ========== COUNTDOWN ========== */}
      <section className="sr" style={{ padding: '80px 20px', textAlign: 'center', background: 'white' }}>
        <h2 style={{ fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', color: '#a855f7', marginBottom: 8, fontWeight: 600 }}>⏰ Cuenta Regresiva</h2>
        <h3 style={{ fontSize: 28, color: '#1e1b4b', fontFamily: 'Georgia, serif', marginBottom: 40, fontWeight: 700 }}>Faltan</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', maxWidth: 500, margin: '0 auto' }}>
          {[
            { value: timeLeft.days, label: 'Días', color: '#ec4899' },
            { value: timeLeft.hours, label: 'Horas', color: '#d946ef' },
            { value: timeLeft.minutes, label: 'Minutos', color: '#a855f7' },
            { value: timeLeft.seconds, label: 'Segundos', color: '#7c3aed' },
          ].map((item, i) => (
            <div key={i} style={{ width: 100, height: 100, borderRadius: 20, background: `linear-gradient(135deg, ${item.color}15, ${item.color}25)`, border: `2px solid ${item.color}30`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: item.color, fontVariantNumeric: 'tabular-nums' }}>{String(item.value).padStart(2, '0')}</span>
              <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{item.label}</span>
            </div>
          ))}
        </div>
        <p style={{ color: '#6b7280', marginTop: 24, fontSize: 15 }}>{dateStr}</p>
        <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Baby+Shower+${parent1}+y+${parent2}&dates=${eventDate.replace(/-/g, '')}T150000/${eventDate.replace(/-/g, '')}T180000&location=${config?.eventLocation || 'Salon'}`}
          target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 20, padding: '10px 24px', borderRadius: 14, background: 'linear-gradient(135deg, #ec4899, #a855f7)', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          📅 Agregar al Calendario
        </a>
      </section>

      <WaveDivider flip />

      {/* ========== EVENT DETAILS ========== */}
      <section className="sr" style={{ padding: '60px 20px', textAlign: 'center', background: '#fef2f8' }}>
        <h2 style={{ fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', color: '#a855f7', marginBottom: 8, fontWeight: 600 }}>📋 Detalles del Evento</h2>
        <h3 style={{ fontSize: 28, color: '#1e1b4b', fontFamily: 'Georgia, serif', marginBottom: 40, fontWeight: 700 }}>Te Esperamos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, maxWidth: 600, margin: '0 auto' }}>
          {[
            { icon: '📅', title: 'Fecha', value: dateStr, bg: '#fce7f3' },
            { icon: '🕐', title: 'Hora', value: eventTime, bg: '#f3e8ff' },
            { icon: '📍', title: 'Lugar', value: config?.eventLocation || 'Salón Principal', bg: '#ede9fe' },
            { icon: '📮', title: 'Dirección', value: config?.eventAddress || 'Calle Principal #123', bg: '#e0f2fe' },
            { icon: '👗', title: 'Vestimenta', value: config?.dressCode || 'Casual Elegante', bg: '#fce7f3' },
            { icon: '🎨', title: 'Tema', value: config?.theme || 'Rosado y Dorado', bg: '#f3e8ff' },
          ].map((item, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 20, padding: '20px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: `1px solid ${item.bg}`, transition: 'transform 0.2s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</div>
              <p style={{ fontSize: 12, color: '#a855f7', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 600 }}>{item.title}</p>
              <p style={{ fontSize: 14, color: '#1e1b4b', fontWeight: 600 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <WaveDivider />

      {/* ========== GENDER REVEAL ========== */}
      <section className="sr" style={{ padding: '80px 20px', textAlign: 'center', background: 'white', position: 'relative', overflow: 'hidden' }}>
        <h2 style={{ fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', color: '#a855f7', marginBottom: 8, fontWeight: 600 }}>🎁 Revelación</h2>
        <h3 style={{ fontSize: 28, color: '#1e1b4b', fontFamily: 'Georgia, serif', marginBottom: 32, fontWeight: 700 }}>¿Niño o Niña?</h3>
        {!genderRevealed ? (
          <button onClick={handleGenderReveal} style={{
            padding: '20px 48px', fontSize: 20, borderRadius: 50,
            background: 'linear-gradient(135deg, #ec4899, #a855f7)', color: 'white', border: 'none',
            cursor: 'pointer', fontWeight: 700, fontFamily: 'Georgia, serif',
            boxShadow: '0 8px 30px rgba(168,85,247,0.3)', animation: 'pulseGlow 2s ease-in-out infinite'
          }}>👶 ¡Descubrir! 👶</button>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 80, marginBottom: 16, animation: 'bounceIn 0.5s ease-out' }}>🎀👧</div>
            <h3 style={{ fontSize: 36, color: '#ec4899', fontWeight: 800, fontFamily: 'Georgia, serif', animation: 'fadeInUp 0.5s 0.2s both' }}>¡Es una Niña!</h3>
            <p style={{ color: '#6b7280', marginTop: 8, animation: 'fadeInUp 0.5s 0.4s both' }}>💕 Estamos emocionados 💕</p>
            {genderParticles.map(p => (
              <span key={p.id} style={{ position: 'absolute', left: '50%', top: '50%', fontSize: 24, pointerEvents: 'none', transform: `translate(${p.x}px, ${p.y}px)`, animation: 'genderParticle 1.5s ease-out forwards', opacity: 0 }}>{p.emoji}</span>
            ))}
          </div>
        )}
      </section>

      {/* ========== BABY SIZE ========== */}
      <section className="sr" style={{ padding: '80px 20px', textAlign: 'center', background: 'linear-gradient(135deg, #faf5ff, #f5f3ff)' }}>
        <h2 style={{ fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', color: '#a855f7', marginBottom: 8, fontWeight: 600 }}>📏 Tamaño del Bebé</h2>
        <h3 style={{ fontSize: 28, color: '#1e1b4b', fontFamily: 'Georgia, serif', marginBottom: 32, fontWeight: 700 }}>¿Qué Tamaño Tiene?</h3>
        <div style={{ display: 'inline-block', background: 'white', borderRadius: 28, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: 400, width: '100%' }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>{fruits[babySizeWeek]?.emoji || '👶'}</div>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#1e1b4b', marginBottom: 4 }}>Semana {babySizeWeek}</p>
          <p style={{ color: '#a855f7', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Tamaño de un {fruits[babySizeWeek]?.name || 'bebé'}</p>
          <p style={{ color: '#6b7280', fontSize: 14 }}>{fruits[babySizeWeek]?.size || 'N/A'} de longitud</p>
          <div style={{ marginTop: 20, height: 6, borderRadius: 3, background: '#f3e8ff', overflow: 'hidden' }}>
            <div style={{ width: `${(babySizeWeek / 40) * 100}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #ec4899, #a855f7)' }} />
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>{Math.round((babySizeWeek / 40) * 100)}% del embarazo</p>
        </div>
      </section>

      {/* ========== SCHEDULE ========== */}
      <section className="sr" style={{ padding: '80px 20px', background: 'white' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', color: '#a855f7', marginBottom: 8, fontWeight: 600 }}>📝 Programa</h2>
          <h3 style={{ fontSize: 28, color: '#1e1b4b', fontFamily: 'Georgia, serif', fontWeight: 700 }}>Itinerario del Evento</h3>
        </div>
        <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #ec4899, #a855f7, #7c3aed)' }} />
          {schedule.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 20, marginBottom: 28, alignItems: 'flex-start' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #ec4899, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 12px rgba(168,85,247,0.2)', zIndex: 1, position: 'relative' }}>{item.icon}</div>
              <div style={{ paddingTop: 4 }}>
                <p style={{ fontSize: 12, color: '#a855f7', fontWeight: 600, letterSpacing: 1 }}>{item.time}</p>
                <p style={{ fontSize: 16, color: '#1e1b4b', fontWeight: 700 }}>{item.event}</p>
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== NAME POLL ========== */}
      <section className="sr" style={{ padding: '80px 20px', background: 'linear-gradient(135deg, #fef2f8, #faf5ff)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', color: '#a855f7', marginBottom: 8, fontWeight: 600 }}>🏷️ Encuesta</h2>
        <h3 style={{ fontSize: 28, color: '#1e1b4b', fontFamily: 'Georgia, serif', marginBottom: 8, fontWeight: 700 }}>¿Cómo debería llamarse?</h3>
        <p style={{ color: '#6b7280', marginBottom: 32, fontSize: 14 }}>Vota por tu nombre favorito</p>
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          {Object.entries(nameVotes).map(([name, votes]) => {
            const total = Object.values(nameVotes).reduce((a, b) => a + b, 0);
            const pct = Math.round((votes / total) * 100);
            return (
              <button key={name} onClick={() => handleVote(name)} disabled={!!userVoted} style={{ display: 'block', width: '100%', marginBottom: 12, padding: '14px 20px', borderRadius: 16, border: userVoted === name ? '2px solid #ec4899' : '2px solid #f3e8ff', background: userVoted === name ? '#fdf2f8' : 'white', cursor: userVoted ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: '#1e1b4b' }}>{name}</span>
                  <span style={{ fontSize: 13, color: '#a855f7', fontWeight: 600 }}>{pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#f3e8ff', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: 'linear-gradient(90deg, #ec4899, #a855f7)', transition: 'width 0.5s' }} />
                </div>
              </button>
            );
          })}
          {userVoted && <p style={{ color: '#a855f7', fontSize: 14, marginTop: 16 }}>✅ ¡Votaste por {userVoted}!</p>}
        </div>
      </section>

      {/* ========== BALLOONS ========== */}
      <section className="sr" style={{ padding: '80px 20px', background: 'white', textAlign: 'center' }}>
        <h2 style={{ fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', color: '#a855f7', marginBottom: 8, fontWeight: 600 }}>🎈 Juego</h2>
        <h3 style={{ fontSize: 28, color: '#1e1b4b', fontFamily: 'Georgia, serif', marginBottom: 8, fontWeight: 700 }}>Explota los Globos</h3>
        <p style={{ color: '#6b7280', marginBottom: 32, fontSize: 14 }}>Toca cada globo para descubrir un mensaje</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, maxWidth: 500, margin: '0 auto' }}>
          {balloonMessages.map((msg, i) => (
            <div key={i} onClick={() => popBalloon(i)} style={{ width: 100, height: 120, cursor: balloonsPopped.has(i) ? 'default' : 'pointer', position: 'relative', transition: 'transform 0.3s', transform: balloonsPopped.has(i) ? 'scale(0)' : 'scale(1)', animation: balloonsPopped.has(i) ? 'none' : `float ${2 + i * 0.3}s ease-in-out infinite` }}>
              {!balloonsPopped.has(i) ? (
                <svg width="100" height="120" viewBox="0 0 100 120">
                  <ellipse cx="50" cy="45" rx="35" ry="42" fill={['#ec4899', '#a855f7', '#f472b6', '#c084fc', '#e879f9', '#f9a8d4'][i]} opacity="0.8" />
                  <polygon points="44,87 50,95 56,87" fill={['#ec4899', '#a855f7', '#f472b6', '#c084fc', '#e879f9', '#f9a8d4'][i]} opacity="0.9" />
                  <line x1="50" y1="95" x2="50" y2="120" stroke="#d1d5db" strokeWidth="1" />
                  <ellipse cx="38" cy="30" rx="8" ry="12" fill="white" opacity="0.3" />
                </svg>
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'bounceIn 0.4s ease-out' }}>
                  <p style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, lineHeight: 1.3 }}>{msg}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        {balloonsPopped.size === balloonMessages.length && (
          <p style={{ color: '#ec4899', fontSize: 18, fontWeight: 700, marginTop: 24, animation: 'bounceIn 0.5s ease-out' }}>🎉 ¡Descubriste todos los mensajes! 🎉</p>
        )}
      </section>

      {/* ========== TIPS ========== */}
      <section className="sr" style={{ padding: '80px 20px', background: 'linear-gradient(135deg, #fef2f8, #faf5ff)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', color: '#a855f7', marginBottom: 8, fontWeight: 600 }}>💡 Consejos</h2>
        <h3 style={{ fontSize: 28, color: '#1e1b4b', fontFamily: 'Georgia, serif', marginBottom: 32, fontWeight: 700 }}>Tips para los Papás</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, maxWidth: 500, margin: '0 auto' }}>
          {tips.map((tip, i) => <TipCard key={i} front={tip.front} back={tip.back} />)}
        </div>
      </section>

      {/* ========== GIFTS ========== */}
      <section className="sr" style={{ padding: '80px 20px', background: 'white', textAlign: 'center' }}>
        <h2 style={{ fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', color: '#a855f7', marginBottom: 8, fontWeight: 600 }}>🎁 Regalos</h2>
        <h3 style={{ fontSize: 28, color: '#1e1b4b', fontFamily: 'Georgia, serif', marginBottom: 8, fontWeight: 700 }}>Sugerencias de Regalos</h3>
        <p style={{ color: '#6b7280', marginBottom: 32, fontSize: 14 }}>Tu presencia es el mejor regalo, pero si deseas algo más...</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, maxWidth: 500, margin: '0 auto' }}>
          {gifts.map((gift, i) => (
            <div key={i} style={{ background: '#fef2f8', borderRadius: 16, padding: '16px 8px', transition: 'transform 0.2s', cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>{gift.emoji}</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1e1b4b' }}>{gift.name}</p>
              <p style={{ fontSize: 11, color: '#9ca3af' }}>{gift.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== WISHES ========== */}
      <section className="sr" style={{ padding: '80px 20px', background: 'linear-gradient(135deg, #faf5ff, #f5f3ff)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', color: '#a855f7', marginBottom: 8, fontWeight: 600 }}>💌 Deseos</h2>
        <h3 style={{ fontSize: 28, color: '#1e1b4b', fontFamily: 'Georgia, serif', marginBottom: 32, fontWeight: 700 }}>Muro de Deseos</h3>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ marginBottom: 32, maxHeight: 300, overflowY: 'auto' }}>
            {wishes.map((wish, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, padding: '14px 18px', marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#1e1b4b' }}>{wish.name}</span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{wish.time}</span>
                </div>
                <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.5 }}>{wish.message}</p>
              </div>
            ))}
          </div>
          <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <input placeholder="Tu nombre" value={newWishName} onChange={e => setNewWishName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #f3e8ff', fontSize: 14, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
            <textarea placeholder="Escribe tu deseo..." value={newWish} onChange={e => setNewWish(e.target.value)} rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #f3e8ff', fontSize: 14, marginBottom: 10, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
            <button onClick={handleAddWish} style={{ padding: '10px 24px', borderRadius: 14, background: 'linear-gradient(135deg, #ec4899, #a855f7)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, width: '100%' }}>💌 Enviar Deseo</button>
          </div>
        </div>
      </section>

      {/* ========== RSVP ========== */}
      <section className="sr" style={{ padding: '80px 20px', background: 'white', textAlign: 'center' }}>
        <h2 style={{ fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', color: '#a855f7', marginBottom: 8, fontWeight: 600 }}>✅ RSVP</h2>
        <h3 style={{ fontSize: 28, color: '#1e1b4b', fontFamily: 'Georgia, serif', marginBottom: 8, fontWeight: 700 }}>Confirma tu Asistencia</h3>
        <p style={{ color: '#6b7280', marginBottom: 32, fontSize: 14 }}>Por favor confirma antes del evento</p>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          {!rsvpSubmitted ? (
            <div style={{ background: '#fef2f8', borderRadius: 24, padding: 28 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {(['confirmed', 'declined'] as const).map(status => (
                  <button key={status} onClick={() => setRsvpStatus(status)} style={{
                    flex: 1, padding: '14px 8px', borderRadius: 14, border: '2px solid',
                    borderColor: rsvpStatus === status ? (status === 'confirmed' ? '#10b981' : '#ef4444') : '#e5e7eb',
                    background: rsvpStatus === status ? (status === 'confirmed' ? '#ecfdf5' : '#fef2f2') : 'white', cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>{status === 'confirmed' ? '✅' : '❌'}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: rsvpStatus === status ? (status === 'confirmed' ? '#10b981' : '#ef4444') : '#6b7280' }}>{status === 'confirmed' ? 'Asistiré' : 'No podré'}</span>
                  </button>
                ))}
              </div>
              {rsvpStatus === 'confirmed' && (
                <>
                  <div style={{ marginBottom: 14, textAlign: 'left' }}>
                    <label style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 4 }}>Acompañantes</label>
                    <select value={rsvpGuests} onChange={e => setRsvpGuests(Number(e.target.value))} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none' }}>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} persona{n > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 14, textAlign: 'left' }}>
                    <label style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 4 }}>Restricciones alimentarias</label>
                    <input value={rsvpDiet} onChange={e => setRsvpDiet(e.target.value)} placeholder="Ej: Vegetariano, alergias..." style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </>
              )}
              <div style={{ marginBottom: 18, textAlign: 'left' }}>
                <label style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 4 }}>Mensaje para los papás</label>
                <textarea value={rsvpMessage} onChange={e => setRsvpMessage(e.target.value)} placeholder="¡Felicidades!" rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handleRSVP} disabled={rsvpStatus === 'pending'} style={{ width: '100%', padding: '14px', borderRadius: 14, background: rsvpStatus === 'pending' ? '#e5e7eb' : 'linear-gradient(135deg, #ec4899, #a855f7)', color: rsvpStatus === 'pending' ? '#9ca3af' : 'white', border: 'none', cursor: rsvpStatus === 'pending' ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700 }}>
                {rsvpStatus === 'confirmed' ? '✅ Confirmar Asistencia' : rsvpStatus === 'declined' ? '❌ Enviar Respuesta' : 'Selecciona una opción'}
              </button>
            </div>
          ) : (
            <div style={{ animation: 'bounceIn 0.5s ease-out' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>{rsvpStatus === 'confirmed' ? '🎉' : '😢'}</div>
              <h3 style={{ fontSize: 24, color: '#1e1b4b', fontWeight: 700, marginBottom: 8, fontFamily: 'Georgia, serif' }}>
                {rsvpStatus === 'confirmed' ? '¡Gracias por confirmar!' : 'Lamentamos que no puedas asistir'}
              </h3>
              <p style={{ color: '#6b7280', fontSize: 15 }}>{rsvpStatus === 'confirmed' ? `Te esperamos con ${rsvpGuests} persona${rsvpGuests > 1 ? 's' : ''}` : 'Te tendremos en nuestros pensamientos 💕'}</p>
            </div>
          )}
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer style={{ padding: '48px 20px', textAlign: 'center', background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
          {['🧸', '🎈', '🍼', '🎀', '⭐'].map((e, i) => (
            <span key={i} style={{ fontSize: 28, animation: `float ${3 + i * 0.5}s ease-in-out infinite` }}>{e}</span>
          ))}
        </div>
        <h3 style={{ fontSize: 24, fontFamily: 'Georgia, serif', marginBottom: 8 }}>{parent1} & {parent2}</h3>
        <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 16 }}>Baby Shower • {dateStr}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <a href={`whatsapp://send?text=¡Estoy invitado al Baby Shower de ${parent1} y ${parent2}! 🍼 ${window.location.href}`}
            style={{ padding: '10px 20px', borderRadius: 14, background: '#25D366', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>💬 WhatsApp</a>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('¡Enlace copiado!') }}
            style={{ padding: '10px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>🔗 Copiar Enlace</button>
        </div>
        <p style={{ fontSize: 11, opacity: 0.4, marginTop: 24 }}>Hecho con 💕</p>
      </footer>
    </div>
  );
}

// ============================================
// WAVE DIVIDER
// ============================================
function WaveDivider({ flip }: { flip?: boolean }) {
  return (
    <div style={{ lineHeight: 0, background: flip ? '#fef2f8' : 'white' }}>
      <svg viewBox="0 0 1440 80" style={{ display: 'block', width: '100%' }} preserveAspectRatio="none">
        <path d={flip ? "M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" : "M0,40 C360,0 720,80 1080,40 C1260,20 1380,30 1440,40 L1440,80 L0,80 Z"}
          fill={flip ? 'white' : '#fef2f8'} />
      </svg>
    </div>
  );
}

// ============================================
// TIP CARD
// ============================================
function TipCard({ front, back }: { front: string; back: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onClick={() => setFlipped(!flipped)} style={{ height: 160, cursor: 'pointer', perspective: '600px' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', transition: 'transform 0.6s', transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)' }}>
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: 'linear-gradient(135deg, #fce7f3, #f3e8ff)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <span style={{ fontSize: 40, marginBottom: 8 }}>{front}</span>
          <p style={{ fontSize: 11, color: '#a855f7', fontWeight: 600 }}>Toca para ver</p>
        </div>
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(135deg, #ec4899, #a855f7)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, color: 'white', fontSize: 13, fontWeight: 600, lineHeight: 1.4, textAlign: 'center' }}>
          {back}
        </div>
      </div>
    </div>
  );
}
