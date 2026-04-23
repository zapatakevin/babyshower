import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getInvitationBySlug, getEventConfig, saveInvitation, getWishMessages, addWishMessage, getNamePollVotes, voteName, markInvitationViewed, generateId } from './store';
import type { Invitation, EventConfig, WishMessage } from './types';

// ===================== CONFETTI COMPONENT =====================
function Confetti() {
  const emojis = ['🎀','🍼','⭐','💖','🧸','☁️','🌸','💎','🦋','🌺','🎈','✨','💝','👶','🎀','🎂'];
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {emojis.map((e, i) => (
        <span key={i} style={{
          position: 'absolute', fontSize: 20 + Math.random() * 20, top: '-5%',
          left: `${Math.random() * 100}%`,
          animation: `confettiFall ${3 + Math.random() * 4}s linear ${Math.random() * 2}s infinite`,
          opacity: 0.85,
        }}>{e}</span>
      ))}
    </div>
  );
}

// ===================== FLOATING DECORATIONS =====================
function FloatingDecorations() {
  const items = ['🧸','🎈','🎀','⭐','☁️','💖','🍼','🌸','🦋','✨','💝','🌟'];
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
      {items.map((item, i) => (
        <span key={i} style={{
          position: 'absolute',
          fontSize: 16 + Math.random() * 16,
          top: `${10 + Math.random() * 80}%`,
          left: `${Math.random() * 100}%`,
          opacity: 0.15,
          animation: `float ${6 + Math.random() * 8}s ease-in-out ${Math.random() * 5}s infinite alternate`,
        }}>{item}</span>
      ))}
    </div>
  );
}

// ===================== WAVY DIVIDER =====================
function WavyDivider({ color2 = '#ffffff', flip = false, color1: _c }: { color2?: string; flip?: boolean; color1?: string }) {
  return (
    <div style={{ lineHeight: 0, margin: '-1px 0' }}>
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 50 }}>
        <path d={flip ? "M0,0 C360,100 1080,0 1440,80 L1440,100 L0,100 Z" : "M0,80 C360,0 1080,100 1440,20 L1440,0 L0,0 Z"} fill={color2} />
      </svg>
    </div>
  );
}

// ===================== SECTION WRAPPER WITH SCROLL REVEAL =====================
function Section({ children, style, id }: { children: React.ReactNode; style?: React.CSSProperties; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} id={id} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(40px)',
      transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ===================== COUNTDOWN TIMER =====================
function Countdown({ date, time }: { date: string; time: string }) {
  const target = new Date(`${date}T${time}`).getTime();
  const getDiff = () => {
    const d = target - Date.now();
    return { days: Math.max(0, Math.floor(d / 86400000)), hours: Math.max(0, Math.floor((d % 86400000) / 3600000)), minutes: Math.max(0, Math.floor((d % 3600000) / 60000)), seconds: Math.max(0, Math.floor((d % 60000) / 1000)) };
  };
  const [diff, setDiff] = useState(getDiff());
  useEffect(() => { const t = setInterval(() => setDiff(getDiff()), 1000); return () => clearInterval(t); }, []);
  const units = [{ label: 'Días', val: diff.days, emoji: '📅' }, { label: 'Horas', val: diff.hours, emoji: '⏰' }, { label: 'Minutos', val: diff.minutes, emoji: '⏳' }, { label: 'Segundos', val: diff.seconds, emoji: '✨' }];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 400, margin: '0 auto' }}>
      {units.map(u => (
        <div key={u.label} style={{ textAlign: 'center', background: 'white', borderRadius: 16, padding: '16px 8px', boxShadow: '0 4px 20px rgba(236,72,153,0.15)' }}>
          <div style={{ fontSize: 14, marginBottom: 4 }}>{u.emoji}</div>
          <div style={{ fontSize: 32, fontWeight: 800, background: 'linear-gradient(135deg,#ec4899,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{String(u.val).padStart(2, '0')}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{u.label}</div>
        </div>
      ))}
    </div>
  );
}

// ===================== BABY SIZE =====================
function BabySize() {
  const [week, setWeek] = useState(24);
  const sizes = [
    { w: 8, fruit: '🫐', name: 'Arándano', cm: 1.6, g: 1 },
    { w: 12, fruit: '🍋', name: 'Limón', cm: 5.4, g: 14 },
    { w: 16, fruit: '🥑', name: 'Aguacate', cm: 11.6, g: 100 },
    { w: 20, fruit: '🍌', name: 'Plátano', cm: 25, g: 300 },
    { w: 24, fruit: '🌽', name: 'Elote', cm: 30, g: 600 },
    { w: 28, fruit: '🍆', name: 'Berenjena', cm: 36, g: 1000 },
    { w: 32, fruit: '🥥', name: 'Coco', cm: 42, g: 1700 },
    { w: 36, fruit: '🍍', name: 'Piña', cm: 47, g: 2600 },
    { w: 40, fruit: '🍉', name: 'Sandía', cm: 51, g: 3400 },
  ];
  const current = sizes.reduce((prev, curr) => Math.abs(curr.w - week) < Math.abs(prev.w - week) ? curr : prev);
  const progress = Math.min(100, ((week - 8) / 32) * 100);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, margin: '10px 0', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>{current.fruit}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#1f2937' }}>Semana {week}</div>
      <div style={{ fontSize: 16, color: '#ec4899', margin: '4px 0' }}>{current.name} • {current.cm} cm • {current.g >= 1000 ? `${(current.g/1000).toFixed(1)} kg` : `${current.g} g`}</div>
      <input type="range" min={8} max={40} value={week} onChange={e => setWeek(Number(e.target.value))}
        style={{ width: '100%', maxWidth: 300, margin: '16px auto', display: 'block', accentColor: '#ec4899' }} />
      <div style={{ background: '#fce7f3', borderRadius: 50, height: 8, maxWidth: 300, margin: '0 auto', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(90deg,#ec4899,#a855f7)', height: '100%', width: `${progress}%`, borderRadius: 50, transition: 'width 0.5s' }} />
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{Math.round(progress)}% del embarazo</div>
    </div>
  );
}

// ===================== MAIN COMPONENT =====================
export default function InvitationView() {
  const { slug } = useParams<{ slug: string }>();
  const [phase, setPhase] = useState<'loading' | 'card' | 'reveal' | 'ready'>('loading');
  const [loadPct, setLoadPct] = useState(0);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardContent, setCardContent] = useState(false);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [error, setError] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [genderRevealed, setGenderRevealed] = useState(false);
  const [genderParticles, setGenderParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [poppedBalloons, setPoppedBalloons] = useState<number[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [factIndex, setFactIndex] = useState(0);
  const [nameVotes, setNameVotes] = useState<Record<string, number>>({});
  const [wishes, setWishes] = useState<WishMessage[]>([]);
  const [newWish, setNewWish] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'none' | 'yes' | 'no'>('none');
  const [rsvpPlusOnes, setRsvpPlusOnes] = useState(0);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [rsvpDietary, setRsvpDietary] = useState('');
  const [rsvpDone, setRsvpDone] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const balloonMessages = ['¡Felicidades! 🎉', '¡Eres especial! 💖', '¡Bienvenido bebé! 🍼', '¡Mucho amor! 💝', '¡Qué emoción! ✨', '¡Bendiciones! 🙏'];
  const facts = [
    'Un bebé nace con大约 270 huesos, pero los adultos solo tienen 206',
    'El latido del corazón del bebé se puede escuchar desde la semana 6',
    'Los bebés pueden saborear los alimentos desde el útero materno',
    'Un recién nacido puede ver objetos a unos 20-30 cm de distancia',
    'Los bebés nacen sin rodillas — se desarrollan después',
    'El primer sonrisa social ocurre alrededor de las 6-8 semanas',
    'Un bebé triplica su peso en el primer año de vida',
    'Los bebés respiran aproximadamente 40 veces por minuto',
    'El cerebro de un bebé es aproximadamente el 25% del tamaño adulto al nacer',
    'Las huellas dactilares se forman durante el segundo trimestre',
  ];

  const tips = [
    { front: '🤱', title: 'Dormir', back: 'Duerme cuando el bebé duerme. El descanso es tu mejor amigo en los primeros meses.' },
    { front: '💕', title: 'Amor', back: 'Confía en tu instinto. Nadie conoce a tu bebé mejor que tú.' },
    { front: '📸', title: 'Fotos', back: 'Toma muchas fotos. Los bebés crecen increíblemente rápido.' },
    { front: '🙏', title: 'Pedir Ayuda', back: 'No tengas miedo de pedir ayuda. No estás sola en esto.' },
    { front: '⏰', title: 'Paciencia', back: 'Todo es una fase. Los días son largos pero los años son cortos.' },
    { front: '💪', title: 'Cuidarte', back: 'Recuerda cuidar de ti misma también. Un padre feliz = bebé feliz.' },
  ];

  // Load data
  useEffect(() => {
    try {
      const inv = getInvitationBySlug(slug || '');
      const cfg = getEventConfig();
      if (inv) {
        setInvitation(inv);
        setConfig(cfg);
        markInvitationViewed(inv.slug);
        if (inv.rsvpResponse) {
          setRsvpDone(true);
          setRsvpStatus(inv.rsvpResponse.attending ? 'yes' : 'no');
        }
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
  }, [slug]);

  // Load wishes & votes
  useEffect(() => {
    if (!slug) return;
    setWishes(getWishMessages().filter(w => w.slug === slug));
    setNameVotes(getNamePollVotes());
  }, [slug]);

  // Fact ticker
  useEffect(() => {
    const t = setInterval(() => setFactIndex(i => (i + 1) % facts.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Loading phases
  useEffect(() => {
    if (error) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let pct = 0;
    const interval = setInterval(() => {
      pct = Math.min(100, pct + 2);
      setLoadPct(pct);
      if (pct >= 100) clearInterval(interval);
    }, 50);
    timers.push(setTimeout(() => setPhase('card'), 2800) as any);
    timers.push(setTimeout(() => setCardOpen(true), 3600) as any);
    timers.push(setTimeout(() => setCardContent(true), 4400) as any);
    timers.push(setTimeout(() => setPhase('reveal'), 6000) as any);
    timers.push(setTimeout(() => { setPhase('ready'); setShowConfetti(true); }, 6800) as any);
    return () => { clearInterval(interval); timers.forEach(clearTimeout); };
  }, [error]);

  // Section spy
  useEffect(() => {
    if (phase !== 'ready') return;
    const sectionIds = ['hero','countdown','details','gender','size','schedule','names','balloons','tips','facts','gifts','wishes','rsvp'];
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = sectionIds.indexOf(e.target.id);
          if (idx >= 0) setActiveSection(idx);
        }
      });
    }, { threshold: 0.3 });
    sectionIds.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [phase]);

  const handleGenderReveal = useCallback(() => {
    setGenderRevealed(true);
    const pts = Array.from({ length: 20 }, (_, i) => ({ id: i, x: Math.random() * 300 - 150, y: Math.random() * 300 - 150 }));
    setGenderParticles(pts);
  }, []);

  const handlePopBalloon = (i: number) => {
    if (poppedBalloons.includes(i)) return;
    setPoppedBalloons(prev => [...prev, i]);
  };

  const handleFlipCard = (i: number) => {
    if (flippedCards.includes(i)) setFlippedCards(prev => prev.filter(x => x !== i));
    else setFlippedCards(prev => [...prev, i]);
  };

  const handleNameVote = (name: string) => {
    setNameVotes(prev => ({ ...prev, [name]: (prev[name] || 0) + 1 }));
    voteName(name);
  };

  const handleAddWish = () => {
    if (!newWish.trim() || !slug) return;
    const w: WishMessage = { id: generateId(), author: invitation?.guestName || 'Anónimo', message: newWish.trim(), createdAt: new Date().toISOString(), slug };
    addWishMessage(w);
    setWishes(prev => [...prev, w]);
    setNewWish('');
  };

  const handleRSVP = (attending: boolean) => {
    if (!invitation) return;
    const updated = {
      ...invitation,
      status: attending ? 'confirmed' as const : 'declined' as const,
      rsvpResponse: { attending, plusOnesCount: rsvpPlusOnes, message: rsvpMessage, dietaryRestrictions: rsvpDietary, respondedAt: new Date().toISOString() },
    };
    saveInvitation(updated);
    setInvitation(updated);
    setRsvpDone(true);
    if (attending) setShowConfetti(true);
  };

  const shareWhatsApp = () => {
    const url = window.location.href;
    const text = `🍼 ¡Estás invitado al Baby Shower de ${config?.parentNames || 'María & Carlos'}!\n\n📅 ${config?.eventDate ? new Date(config.eventDate + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}\n⏰ ${config?.eventTime || ''}\n📍 ${config?.eventLocation || ''}\n\n📎 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('¡Link copiado! 📋');
  };

  const addCalendar = () => {
    if (!config) return;
    const d = new Date(`${config.eventDate}T${config.eventTime}`);
    const fmt = (x: Date) => x.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Baby+Shower+${encodeURIComponent(config.parentNames)}&dates=${fmt(d)}/${fmt(new Date(d.getTime() + 3 * 3600000))}&location=${encodeURIComponent(config.eventLocation + ', ' + config.eventAddress)}&details=${encodeURIComponent('Baby Shower de ' + config.parentNames)}`;
    window.open(url, '_blank');
  };

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#fce7f3,#faf5ff)', padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>😢</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>Invitación no encontrada</h2>
        <p style={{ color: '#6b7280', margin: '8px 0 20px' }}>Esta invitación no existe o ha sido eliminada.</p>
        <button onClick={() => { localStorage.removeItem('babyshower_invitations'); window.location.reload(); }} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#ec4899,#a855f7)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>🔄 Regenerar Datos Demo</button>
        <a href="#/" style={{ marginTop: 16, color: '#ec4899', fontWeight: 600 }}>← Ir al inicio</a>
      </div>
    );
  }

  if (!invitation || !config) return null;

  // ===================== LOADING SCREEN =====================
  if (phase === 'loading' || phase === 'card' || phase === 'reveal') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: phase === 'reveal' ? 'transparent' : 'linear-gradient(135deg,#1a0a2e,#2d1b4e,#1a0a2e)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 1s ease-out',
        opacity: phase === 'reveal' ? 0 : 1,
      }}>
        {/* Floating particles */}
        {!cardOpen && Array.from({ length: 15 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%',
            width: 4 + Math.random() * 6, height: 4 + Math.random() * 6,
            background: `rgba(${200 + Math.random() * 55},${100 + Math.random() * 100},${200 + Math.random() * 55},${0.2 + Math.random() * 0.3})`,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            animation: `float ${4 + Math.random() * 6}s ease-in-out ${Math.random() * 3}s infinite alternate`,
          }} />
        ))}

        {phase === 'loading' && (
          <div style={{ textAlign: 'center', zIndex: 2 }}>
            <div style={{ fontSize: 64, marginBottom: 20, animation: 'float 2s ease-in-out infinite' }}>🍼</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
              {['💖','💕','💝'].map((h, i) => (
                <span key={i} style={{ fontSize: 24, animation: `heartBeat 1.2s ease-in-out ${i * 0.3}s infinite` }}>{h}</span>
              ))}
            </div>
            <div style={{ color: '#e9d5ff', fontSize: 16, marginBottom: 16, fontWeight: 500 }}>Preparando tu invitación...</div>
            <div style={{ width: 240, height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden', margin: '0 auto' }}>
              <div style={{ width: `${loadPct}%`, height: '100%', background: 'linear-gradient(90deg,#ec4899,#a855f7,#ec4899)', borderRadius: 3, transition: 'width 0.1s' }} />
            </div>
            <div style={{ color: '#c4b5fd', fontSize: 14, marginTop: 8 }}>{loadPct}%</div>
          </div>
        )}

        {phase === 'card' && (
          <div style={{ perspective: 1000, zIndex: 2 }}>
            <div style={{
              width: 300, height: 380, position: 'relative',
              animation: 'bounceIn 0.8s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              {/* Card back (inside content) */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 16,
                background: 'linear-gradient(135deg,#fff7ed,#fef3c7,#fdf2f8)',
                border: '2px solid #fecdd3', padding: 32, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                opacity: cardContent ? 1 : 0, transition: 'opacity 0.6s ease 0.3s',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎀</div>
                <div style={{ fontSize: 14, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>Estás Invitado</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#ec4899', margin: '8px 0', lineHeight: 1.2 }}>
                  {invitation.guestName} {invitation.guestLastName}
                </div>
                {invitation.customMessage && (
                  <div style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic', margin: '8px 0', lineHeight: 1.4 }}>
                    "{invitation.customMessage}"
                  </div>
                )}
                <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg,#ec4899,#a855f7)', margin: '12px 0', borderRadius: 1 }} />
                <div style={{ fontSize: 14, color: '#a855f7', fontWeight: 600 }}>Baby Shower de {config.parentNames}</div>
              </div>

              {/* Card front (cover) - folds up */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 16,
                background: 'linear-gradient(135deg,#ec4899,#d946ef,#a855f7)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                transformOrigin: 'top center',
                transform: cardOpen ? 'rotateX(-180deg)' : 'rotateX(0deg)',
                transition: 'transform 1.2s cubic-bezier(0.4,0,0.2,1)',
                backfaceVisibility: 'hidden',
                boxShadow: '0 20px 60px rgba(168,85,247,0.4)',
                textAlign: 'center', padding: 32, color: 'white', zIndex: 2,
              }}>
                <div style={{ fontSize: 48, marginBottom: 12, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>🍼</div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>BABY SHOWER</div>
                <div style={{ width: 40, height: 2, background: 'rgba(255,255,255,0.6)', margin: '12px 0', borderRadius: 1 }} />
                <div style={{ fontSize: 16, fontWeight: 600, opacity: 0.9 }}>{config.parentNames}</div>
                <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 18, opacity: 0.5 }}>🎀</div>
                <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 18, opacity: 0.5 }}>🎀</div>
                <div style={{ position: 'absolute', bottom: 16, left: 16, fontSize: 18, opacity: 0.5 }}>⭐</div>
                <div style={{ position: 'absolute', bottom: 16, right: 16, fontSize: 18, opacity: 0.5 }}>⭐</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 24, color: '#c4b5fd', fontSize: 14 }}>
              {cardOpen ? `¡Hola ${invitation.guestName}! ✨` : 'Abriendo tu invitación...'}
            </div>
          </div>
        )}

        {phase === 'reveal' && <div />}
      </div>
    );
  }

  // ===================== MAIN INVITATION =====================
  const sectionIds = ['hero','countdown','details','gender','size','schedule','names','balloons','tips','facts','gifts','wishes','rsvp'];

  return (
    <div style={{ minHeight: '100vh', background: '#fefcfd', position: 'relative', overflow: 'hidden' }}>
      {showConfetti && <Confetti />}
      <FloatingDecorations />

      {/* ===== SIDE NAV DOTS ===== */}
      <div style={{ position: 'fixed', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sectionIds.map((id, i) => (
          <button key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })} title={id}
            style={{ width: activeSection === i ? 12 : 8, height: activeSection === i ? 12 : 8, borderRadius: '50%', border: 'none',
              background: activeSection === i ? '#ec4899' : '#e5e7eb', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
        ))}
      </div>

      {/* ===== FLOATING BUTTONS ===== */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={shareWhatsApp} title="Compartir por WhatsApp" style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', background: '#25D366', color: 'white', fontSize: 22, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,211,102,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💬</button>
        <button onClick={copyLink} title="Copiar link" style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', background: '#a855f7', color: 'white', fontSize: 22, cursor: 'pointer', boxShadow: '0 4px 12px rgba(168,85,247,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔗</button>
      </div>

      {/* ========== HERO SECTION ========== */}
      <section id="hero" style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, rgba(236,72,153,0.85), rgba(168,85,247,0.7)), url('/images/hero-baby.jpg') center/cover`,
        position: 'relative', textAlign: 'center', padding: '40px 20px', color: 'white',
      }}>
        {/* Ositos y globos arriba */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, overflow: 'hidden', pointerEvents: 'none' }}>
          {/* Arco de globos */}
          {[...Array(11)].map((_, i) => {
            const colors = ['#f472b6','#c084fc','#fb7185','#e879f9','#f9a8d4','#d946ef','#f472b6','#c084fc','#fb7185','#e879f9','#f9a8d4'];
            const x = 5 + i * 9;
            const yOffset = Math.sin(i * 0.6) * 20;
            return (
              <div key={`b${i}`} style={{ position: 'absolute', left: `${x}%`, top: 10 + yOffset, transform: 'translateX(-50%)', animation: `float ${3 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite alternate` }}>
                <div style={{ width: 36, height: 44, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', background: colors[i], boxShadow: `inset -6px -4px 8px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)`, position: 'relative' }}>
                  <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `8px solid ${colors[i]}` }} />
                  <div style={{ position: 'absolute', top: 6, left: 10, width: 8, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
                </div>
                <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.5)', margin: '0 auto' }} />
              </div>
            );
          })}
          {/* Ositos */}
          <span style={{ position: 'absolute', left: '8%', top: 50, fontSize: 40, animation: 'float 4s ease-in-out 0.5s infinite alternate', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🧸</span>
          <span style={{ position: 'absolute', right: '10%', top: 40, fontSize: 50, animation: 'float 5s ease-in-out 1s infinite alternate', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🧸</span>
          <span style={{ position: 'absolute', left: '25%', top: 65, fontSize: 32, animation: 'float 3.5s ease-in-out 0.2s infinite alternate', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🧸</span>
        </div>

        <div style={{ position: 'relative', zIndex: 2, marginTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 8, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>🍼</div>
          <div style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 6, opacity: 0.9, marginBottom: 8 }}>Baby Shower</div>
          <h1 style={{ fontSize: 42, fontWeight: 800, textShadow: '0 2px 12px rgba(0,0,0,0.3)', margin: '8px 0', lineHeight: 1.1 }}>{config.parentNames}</h1>
          <div style={{ width: 60, height: 3, background: 'rgba(255,255,255,0.6)', margin: '16px auto', borderRadius: 2 }} />
          <div style={{ fontSize: 15, opacity: 0.9, fontWeight: 500 }}>
            {new Date(config.eventDate + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>⏰ {config.eventTime}</div>

          {/* Guest greeting */}
          <div style={{ marginTop: 32, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 20, padding: '20px 32px', display: 'inline-block', border: '1px solid rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 3, opacity: 0.8, marginBottom: 6 }}>✨ Invitado Especial ✨</div>
            <div style={{ fontSize: 28, fontWeight: 700, textShadow: '0 1px 6px rgba(0,0,0,0.2)' }}>{invitation.guestName} {invitation.guestLastName}</div>
            {invitation.customMessage && (
              <div style={{ fontSize: 14, opacity: 0.85, marginTop: 8, fontStyle: 'italic', maxWidth: 300 }}>"{invitation.customMessage}"</div>
            )}
            {invitation.tableNumber && (
              <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 16px', fontSize: 13, display: 'inline-block' }}>🪑 Mesa {invitation.tableNumber}</div>
            )}
          </div>

          {/* Scroll indicator */}
          <div style={{ marginTop: 40, animation: 'bounce 2s infinite' }}>
            <div style={{ fontSize: 24 }}>👇</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Desliza para ver más</div>
          </div>
        </div>
      </section>

      <div style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7)', height: 4 }} />

      {/* ========== COUNTDOWN ========== */}
      <section id="countdown" style={{ background: '#fefcfd', padding: '60px 20px' }}>
        <Section>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ background: 'linear-gradient(135deg,#fce7f3,#faf5ff)', padding: '6px 20px', borderRadius: 20, fontSize: 13, color: '#a855f7', fontWeight: 600, display: 'inline-block' }}>⏰ Cuenta Regresiva</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginTop: 12 }}>¡Falta poco!</h2>
          </div>
          <Countdown date={config.eventDate} time={config.eventTime} />
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button onClick={addCalendar} style={{ padding: '10px 24px', borderRadius: 12, border: '2px solid #ec4899', background: 'white', color: '#ec4899', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>📅 Agregar al Calendario</button>
          </div>
        </Section>
      </section>

      <WavyDivider color1="#fefcfd" color2="#fce7f3" />

      {/* ========== EVENT DETAILS ========== */}
      <section id="details" style={{ background: '#fce7f3', padding: '60px 20px' }}>
        <Section>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ background: 'white', padding: '6px 20px', borderRadius: 20, fontSize: 13, color: '#ec4899', fontWeight: 600, display: 'inline-block' }}>📋 Detalles del Evento</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginTop: 12 }}>¿Cuándo y Dónde?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, maxWidth: 600, margin: '0 auto' }}>
            {[
              { icon: '📅', title: 'Fecha', desc: new Date(config.eventDate + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
              { icon: '⏰', title: 'Hora', desc: config.eventTime },
              { icon: '📍', title: 'Lugar', desc: config.eventLocation },
              { icon: '🗺️', title: 'Dirección', desc: config.eventAddress },
              { icon: '👗', title: 'Código de Vestimenta', desc: config.dressCode },
              { icon: '🎨', title: 'Tema', desc: config.theme },
            ].map((item, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, padding: 20, textAlign: 'center', boxShadow: '0 2px 12px rgba(236,72,153,0.1)', transition: 'transform 0.3s', cursor: 'default' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')} onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#fce7f3,#faf5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 22 }}>{item.icon}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 14, color: '#1f2937', fontWeight: 600 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </Section>
      </section>

      <WavyDivider color1="#fce7f3" color2="#faf5ff" />

      {/* ========== GENDER REVEAL ========== */}
      <section id="gender" style={{ background: '#faf5ff', padding: '60px 20px' }}>
        <Section>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ background: 'white', padding: '6px 20px', borderRadius: 20, fontSize: 13, color: '#a855f7', fontWeight: 600, display: 'inline-block' }}>🎁 Revelación</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginTop: 12 }}>¿Niño o Niña?</h2>
          </div>
          <div style={{ textAlign: 'center', position: 'relative' }}>
            {!genderRevealed ? (
              <button onClick={handleGenderReveal} style={{
                padding: '20px 48px', borderRadius: 50, border: 'none',
                background: 'linear-gradient(135deg,#ec4899,#a855f7)', color: 'white',
                fontSize: 20, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 8px 30px rgba(168,85,247,0.4)',
                animation: 'pulseGlow 2s ease-in-out infinite',
                transition: 'transform 0.2s',
              }}>🎉 ¡Descubre el Género! 🎉</button>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 80, animation: 'bounceIn 0.8s', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>
                  {config.gender === 'girl' ? '🎀' : config.gender === 'boy' ? '🚙' : '🌈'}
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, margin: '12px 0', animation: 'bounceIn 0.8s 0.2s both',
                  background: config.gender === 'girl' ? 'linear-gradient(135deg,#ec4899,#f472b6)' : config.gender === 'boy' ? 'linear-gradient(135deg,#3b82f6,#60a5fa)' : 'linear-gradient(135deg,#f59e0b,#a855f7)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {config.gender === 'girl' ? '¡Es una Niña! 💖' : config.gender === 'boy' ? '¡Es un Niño! 💙' : '¡Es una Sorpresa! 🌈'}
                </div>
                {genderParticles.map(p => (
                  <span key={p.id} style={{ position: 'absolute', left: '50%', top: '50%', fontSize: 16, pointerEvents: 'none',
                    animation: `genderParticle 1s ease-out forwards`, '--tx': `${p.x}px`, '--ty': `${p.y}px` } as any}>
                    {['💖','🎀','✨','🌸','💕','💝','🦋','🌟','💐','🎊'][p.id % 10]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>
      </section>

      <WavyDivider color1="#faf5ff" color2="#fefcfd" />

      {/* ========== BABY SIZE ========== */}
      <section id="size" style={{ background: '#fefcfd', padding: '60px 20px' }}>
        <Section>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ background: 'linear-gradient(135deg,#fce7f3,#faf5ff)', padding: '6px 20px', borderRadius: 20, fontSize: 13, color: '#a855f7', fontWeight: 600, display: 'inline-block' }}>📏 Crecimiento</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginTop: 12 }}>¿Qué Tamaño Tiene?</h2>
          </div>
          <div style={{ maxWidth: 400, margin: '0 auto', background: 'white', borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <BabySize />
          </div>
        </Section>
      </section>

      <WavyDivider color1="#fefcfd" color2="#fff7ed" />

      {/* ========== SCHEDULE ========== */}
      <section id="schedule" style={{ background: '#fff7ed', padding: '60px 20px' }}>
        <Section>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ background: 'white', padding: '6px 20px', borderRadius: 20, fontSize: 13, color: '#f59e0b', fontWeight: 600, display: 'inline-block' }}>📝 Programa</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginTop: 12 }}>Itinerario del Evento</h2>
          </div>
          <div style={{ maxWidth: 500, margin: '0 auto', position: 'relative', paddingLeft: 40 }}>
            <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom,#f59e0b,#ec4899,#a855f7)', borderRadius: 1 }} />
            {config.schedule.map((item, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: 24 }}>
                <div style={{ position: 'absolute', left: -33, top: 4, width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>{item.icon}</div>
                <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginLeft: 16 }}>
                  <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, marginBottom: 2 }}>{item.time}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>{item.event}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </section>

      <WavyDivider color1="#fff7ed" color2="#fce7f3" />

      {/* ========== NAME POLL ========== */}
      {config.namePoll && config.namePoll.length > 0 && (
        <section id="names" style={{ background: '#fce7f3', padding: '60px 20px' }}>
          <Section>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <span style={{ background: 'white', padding: '6px 20px', borderRadius: 20, fontSize: 13, color: '#ec4899', fontWeight: 600, display: 'inline-block' }}>🏷️ Encuesta</span>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginTop: 12 }}>¿Cómo debería llamarse?</h2>
              <p style={{ color: '#6b7280', fontSize: 14 }}>Vota por tu nombre favorito</p>
            </div>
            <div style={{ maxWidth: 400, margin: '0 auto' }}>
              {config.namePoll.map(name => {
                const total = Object.values(nameVotes).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round(((nameVotes[name] || 0) / total) * 100);
                return (
                  <div key={name} style={{ background: 'white', borderRadius: 16, padding: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => handleNameVote(name)} onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                    <button style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #ec4899', background: nameVotes[name] ? '#ec4899' : 'white', color: nameVotes[name] ? 'white' : '#ec4899', fontSize: 16, cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}>{nameVotes[name] ? '♥' : '♡'}</button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: '#1f2937' }}>{name}</span>
                        <span style={{ fontSize: 13, color: '#ec4899', fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ background: '#fce7f3', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ background: 'linear-gradient(90deg,#ec4899,#a855f7)', height: '100%', width: `${pct}%`, borderRadius: 3, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </section>
      )}

      {/* ========== BALLOON POP GAME ========== */}
      <section id="balloons" style={{ background: '#faf5ff', padding: '60px 20px' }}>
        <Section>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ background: 'white', padding: '6px 20px', borderRadius: 20, fontSize: 13, color: '#a855f7', fontWeight: 600, display: 'inline-block' }}>🎈 Juego</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginTop: 12 }}>¡Explota los Globos!</h2>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Toca cada globo para descubrir un mensaje</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 320, margin: '0 auto' }}>
            {balloonMessages.map((msg, i) => {
              const popped = poppedBalloons.includes(i);
              const colors = ['#f472b6','#c084fc','#fb7185','#e879f9','#a78bfa','#f9a8d4'];
              return (
                <div key={i} onClick={() => handlePopBalloon(i)} style={{
                  textAlign: 'center', cursor: popped ? 'default' : 'pointer', transition: 'all 0.3s',
                  transform: popped ? 'scale(0.8)' : 'scale(1)', opacity: popped ? 0.7 : 1,
                }}>
                  <div style={{ fontSize: 56, animation: popped ? 'none' : `float ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite alternate` }}>
                    {popped ? '💥' : '🎈'}
                  </div>
                  {popped && <div style={{ fontSize: 11, color: colors[i], fontWeight: 600, marginTop: 4, minHeight: 30 }}>{msg}</div>}
                </div>
              );
            })}
          </div>
          {poppedBalloons.length === balloonMessages.length && (
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 16, color: '#ec4899', fontWeight: 700, animation: 'bounceIn 0.5s' }}>
              🎉 ¡Felicidades! Explotaste todos los globos 🎉
            </div>
          )}
        </Section>
      </section>

      {/* ========== TIPS FLIP CARDS ========== */}
      <section id="tips" style={{ background: '#fefcfd', padding: '60px 20px' }}>
        <Section>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ background: 'linear-gradient(135deg,#fce7f3,#faf5ff)', padding: '6px 20px', borderRadius: 20, fontSize: 13, color: '#a855f7', fontWeight: 600, display: 'inline-block' }}>💡 Consejos</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginTop: 12 }}>Consejos para los Papás</h2>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Toca cada carta para ver el consejo</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, maxWidth: 500, margin: '0 auto' }}>
            {tips.map((tip, i) => {
              const flipped = flippedCards.includes(i);
              return (
                <div key={i} onClick={() => handleFlipCard(i)} style={{
                  height: 180, perspective: 800, cursor: 'pointer',
                }}>
                  <div style={{
                    width: '100%', height: '100%', position: 'relative',
                    transition: 'transform 0.6s',
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: 'linear-gradient(135deg,#fce7f3,#faf5ff)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px solid #f3e8ff' }}>
                      <div style={{ fontSize: 36 }}>{tip.front}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginTop: 8 }}>{tip.title}</div>
                    </div>
                    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: 'white', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotateY(180deg)', padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '2px solid #fce7f3' }}>
                      <div style={{ fontSize: 13, color: '#1f2937', fontWeight: 500, textAlign: 'center', lineHeight: 1.4 }}>{tip.back}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </section>

      {/* ========== FUN FACTS ========== */}
      <section id="facts" style={{ background: '#fff7ed', padding: '40px 20px' }}>
        <Section>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>💡</span>
            <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>¿Sabías que...?</div>
            <div style={{ fontSize: 16, color: '#1f2937', fontWeight: 500, maxWidth: 500, margin: '0 auto', minHeight: 48, lineHeight: 1.5 }}>
              {facts[factIndex]}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
              {facts.map((_, i) => (
                <div key={i} style={{ width: factIndex === i ? 16 : 6, height: 6, borderRadius: 3, background: factIndex === i ? '#f59e0b' : '#e5e7eb', transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>
        </Section>
      </section>

      <WavyDivider color1="#fff7ed" color2="#fce7f3" />

      {/* ========== GIFT SUGGESTIONS ========== */}
      <section id="gifts" style={{ background: '#fce7f3', padding: '60px 20px' }}>
        <Section>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ background: 'white', padding: '6px 20px', borderRadius: 20, fontSize: 13, color: '#ec4899', fontWeight: 600, display: 'inline-block' }}>🎁 Regalos</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginTop: 12 }}>Sugerencias de Regalos</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, maxWidth: 500, margin: '0 auto' }}>
            {(config.giftRegistry || []).map((gift, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, padding: 16, textAlign: 'center', boxShadow: '0 2px 8px rgba(236,72,153,0.08)', transition: 'transform 0.2s', cursor: 'default' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')} onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{gift.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{gift.name}</div>
              </div>
            ))}
          </div>
        </Section>
      </section>

      <WavyDivider color1="#fce7f3" color2="#faf5ff" />

      {/* ========== WISH WALL ========== */}
      <section id="wishes" style={{ background: '#faf5ff', padding: '60px 20px' }}>
        <Section>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ background: 'white', padding: '6px 20px', borderRadius: 20, fontSize: 13, color: '#a855f7', fontWeight: 600, display: 'inline-block' }}>💌 Deseos</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginTop: 12 }}>Muro de Deseos</h2>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Deja un mensaje para los papás y el bebé</p>
          </div>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            {/* Existing wishes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {wishes.filter(w => w.slug === slug).map(w => (
                <div key={w.id} style={{ background: 'white', borderRadius: 16, padding: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#a855f7', fontSize: 13 }}>💌 {w.author}</span>
                    <span style={{ fontSize: 11, color: '#d1d5db' }}>{new Date(w.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.4 }}>{w.message}</div>
                </div>
              ))}
            </div>
            {/* Add wish form */}
            <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <textarea value={newWish} onChange={e => setNewWish(e.target.value)} placeholder="Escribe tu deseo aquí..."
                style={{ width: '100%', border: '2px solid #f3e8ff', borderRadius: 12, padding: 12, fontSize: 14, resize: 'none', height: 80, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              <button onClick={handleAddWish} disabled={!newWish.trim()} style={{
                width: '100%', marginTop: 8, padding: '10px 0', borderRadius: 12, border: 'none',
                background: newWish.trim() ? 'linear-gradient(135deg,#ec4899,#a855f7)' : '#e5e7eb',
                color: newWish.trim() ? 'white' : '#9ca3af', fontWeight: 700, cursor: newWish.trim() ? 'pointer' : 'default', fontSize: 14, transition: 'all 0.3s',
              }}>✨ Enviar Deseo</button>
            </div>
          </div>
        </Section>
      </section>

      <WavyDivider color1="#faf5ff" color2="#fefcfd" />

      {/* ========== RSVP ========== */}
      <section id="rsvp" style={{ background: '#fefcfd', padding: '60px 20px' }}>
        <Section>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ background: 'linear-gradient(135deg,#fce7f3,#faf5ff)', padding: '6px 20px', borderRadius: 20, fontSize: 13, color: '#a855f7', fontWeight: 600, display: 'inline-block' }}>✅ Confirmar</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginTop: 12 }}>Confirma tu Asistencia</h2>
          </div>

          {rsvpDone ? (
            <div style={{ textAlign: 'center', background: 'white', borderRadius: 24, padding: 32, maxWidth: 400, margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>{rsvpStatus === 'yes' ? '🎉' : '💙'}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: rsvpStatus === 'yes' ? '#ec4899' : '#6b7280' }}>
                {rsvpStatus === 'yes' ? '¡Gracias por confirmar!' : 'Lamentamos que no puedas asistir'}
              </div>
              <div style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>Te esperamos con mucho cariño 💕</div>
              {rsvpStatus === 'yes' && (
                <button onClick={shareWhatsApp} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 12, border: 'none', background: '#25D366', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>💬 Compartir por WhatsApp</button>
              )}
            </div>
          ) : (
            <div style={{ maxWidth: 400, margin: '0 auto', background: 'white', borderRadius: 24, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              {/* Yes/No buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <button onClick={() => setRsvpStatus('yes')} style={{
                  padding: '14px 0', borderRadius: 14, border: rsvpStatus === 'yes' ? '2px solid #ec4899' : '2px solid #e5e7eb',
                  background: rsvpStatus === 'yes' ? '#fdf2f8' : 'white', color: rsvpStatus === 'yes' ? '#ec4899' : '#6b7280',
                  fontWeight: 700, cursor: 'pointer', fontSize: 16, transition: 'all 0.3s',
                }}>✅ ¡Asistiré!</button>
                <button onClick={() => setRsvpStatus('no')} style={{
                  padding: '14px 0', borderRadius: 14, border: rsvpStatus === 'no' ? '2px solid #6b7280' : '2px solid #e5e7eb',
                  background: rsvpStatus === 'no' ? '#f3f4f6' : 'white', color: '#6b7280',
                  fontWeight: 700, cursor: 'pointer', fontSize: 16, transition: 'all 0.3s',
                }}>😢 No podré</button>
              </div>

              {rsvpStatus === 'yes' && (
                <>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>👥 Acompañantes</label>
                  <input type="number" min={0} max={invitation.plusOnes || 5} value={rsvpPlusOnes} onChange={e => setRsvpPlusOnes(Number(e.target.value))}
                    style={{ width: '100%', padding: 10, borderRadius: 12, border: '2px solid #f3e8ff', fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />

                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>🍽️ Restricciones Alimentarias</label>
                  <input type="text" value={rsvpDietary} onChange={e => setRsvpDietary(e.target.value)} placeholder="Vegetariano, alergias, etc."
                    style={{ width: '100%', padding: 10, borderRadius: 12, border: '2px solid #f3e8ff', fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
                </>
              )}

              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>💌 Mensaje para los papás</label>
              <textarea value={rsvpMessage} onChange={e => setRsvpMessage(e.target.value)} placeholder="Escribe un mensajito..."
                style={{ width: '100%', padding: 10, borderRadius: 12, border: '2px solid #f3e8ff', fontSize: 14, height: 70, resize: 'none', outline: 'none', fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box' }} />

              {rsvpStatus !== 'none' && (
                <button onClick={() => handleRSVP(rsvpStatus === 'yes')} style={{
                  width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                  background: rsvpStatus === 'yes' ? 'linear-gradient(135deg,#ec4899,#a855f7)' : '#6b7280',
                  color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 16,
                  boxShadow: rsvpStatus === 'yes' ? '0 4px 20px rgba(236,72,153,0.3)' : 'none',
                }}>
                  {rsvpStatus === 'yes' ? '🎉 ¡Confirmar Asistencia!' : 'Enviar Respuesta'}
                </button>
              )}
            </div>
          )}
        </Section>
      </section>

      {/* ========== FOOTER ========== */}
      <footer style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7)', padding: '40px 20px', textAlign: 'center', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🍼🧸🎈</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Baby Shower de {config.parentNames}</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 8 }}>
            {new Date(config.eventDate + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {config.eventTime}
          </div>
          <div style={{ fontSize: 13, opacity: 0.6, marginTop: 16 }}>¡Te esperamos con mucho amor! 💕</div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={shareWhatsApp} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', fontSize: 13 }}>💬 WhatsApp</button>
            <button onClick={copyLink} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', fontSize: 13 }}>🔗 Copiar Link</button>
          </div>
        </div>
        {/* Floating emojis */}
        {['🎀','⭐','💖','☁️','🌸','💝'].map((e, i) => (
          <span key={i} style={{ position: 'absolute', fontSize: 20, opacity: 0.15,
            left: `${10 + i * 15}%`, top: `${20 + Math.random() * 60}%`,
            animation: `float ${4 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite alternate` }}>{e}</span>
        ))}
      </footer>
    </div>
  );
}
