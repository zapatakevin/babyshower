import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEventConfig, saveEventConfig, seedDemoData, getInvitations } from '../store';
import { EventConfig } from '../types';

export default function AdminConfig() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<EventConfig>(getEventConfig());
  const [saved, setSaved] = useState(false);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  const handleChange = (field: keyof EventConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleScheduleChange = (index: number, field: string, value: string) => {
    const newSchedule = [...config.schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setConfig(prev => ({ ...prev, schedule: newSchedule }));
    setSaved(false);
  };

  const addScheduleItem = () => {
    setConfig(prev => ({
      ...prev,
      schedule: [...prev.schedule, { time: '', event: '', icon: '🎉', desc: '' }],
    }));
    setSaved(false);
  };

  const removeScheduleItem = (index: number) => {
    setConfig(prev => ({ ...prev, schedule: prev.schedule.filter((_, i) => i !== index) }));
    setSaved(false);
  };

  const handleGiftChange = (index: number, field: string, value: string | boolean) => {
    const newGifts = [...config.giftRegistry];
    newGifts[index] = { ...newGifts[index], [field]: value };
    setConfig(prev => ({ ...prev, giftRegistry: newGifts }));
    setSaved(false);
  };

  const addGift = () => {
    setConfig(prev => ({ ...prev, giftRegistry: [...prev.giftRegistry, { name: '', icon: '🎁', claimed: false }] }));
    setSaved(false);
  };

  const removeGift = (index: number) => {
    setConfig(prev => ({ ...prev, giftRegistry: prev.giftRegistry.filter((_, i) => i !== index) }));
    setSaved(false);
  };

  const handleNamePollChange = (index: number, value: string) => {
    const newPoll = [...config.namePoll];
    newPoll[index] = value;
    setConfig(prev => ({ ...prev, namePoll: newPoll }));
    setSaved(false);
  };

  const addNamePoll = () => {
    setConfig(prev => ({ ...prev, namePoll: [...prev.namePoll, ''] }));
    setSaved(false);
  };

  const removeNamePoll = (index: number) => {
    setConfig(prev => ({ ...prev, namePoll: prev.namePoll.filter((_, i) => i !== index) }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveEventConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSeed = () => {
    seedDemoData();
    setShowSeedConfirm(false);
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-xl border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">←</button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">⚙️ Configuración</h1>
              <p className="text-xs text-gray-500">Personaliza tu Baby Shower</p>
            </div>
          </div>
          {getInvitations().length === 0 && (
            <button onClick={() => setShowSeedConfirm(true)} className="px-3 py-2 text-sm font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-all">
              🎲 Cargar Demo
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-gray-100">
              <h2 className="font-bold text-gray-700 flex items-center gap-2">
                <span className="w-8 h-8 bg-pink-500 text-white rounded-lg flex items-center justify-center text-sm">1</span>
                Información Básica
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">👪 Nombres de los Papás</label>
                  <input type="text" value={config.parentNames} onChange={(e) => handleChange('parentNames', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all bg-white/50"
                    placeholder="Ej: María & Carlos" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">🍼 Nombre del Bebé</label>
                  <input type="text" value={config.babyName} onChange={(e) => handleChange('babyName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all bg-white/50"
                    placeholder="Ej: Baby García" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">🎀 Género del Bebé</label>
                <div className="flex gap-3">
                  {([
                    { value: 'girl', label: '👧 Niña', color: 'from-pink-400 to-rose-500' },
                    { value: 'boy', label: '👦 Niño', color: 'from-blue-400 to-indigo-500' },
                    { value: 'surprise', label: '🎁 Sorpresa', color: 'from-purple-400 to-violet-500' },
                  ] as const).map((option) => (
                    <button key={option.value} type="button" onClick={() => handleChange('gender', option.value)}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                        config.gender === option.value ? `bg-gradient-to-r ${option.color} text-white shadow-md` : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">🎨 Tema del Evento</label>
                <input type="text" value={config.theme} onChange={(e) => handleChange('theme', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all bg-white/50"
                  placeholder="Ej: Rosado y Dorado" />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-gray-100">
              <h2 className="font-bold text-gray-700 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-500 text-white rounded-lg flex items-center justify-center text-sm">2</span>
                Detalles del Evento
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">📅 Fecha</label>
                  <input type="date" value={config.eventDate} onChange={(e) => handleChange('eventDate', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all bg-white/50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">🕐 Hora</label>
                  <input type="time" value={config.eventTime} onChange={(e) => handleChange('eventTime', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all bg-white/50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">📍 Lugar</label>
                <input type="text" value={config.eventLocation} onChange={(e) => handleChange('eventLocation', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all bg-white/50"
                  placeholder="Ej: Jardín de la Hacienda Los Olivos" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">🏠 Dirección</label>
                <input type="text" value={config.eventAddress} onChange={(e) => handleChange('eventAddress', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all bg-white/50"
                  placeholder="Ej: Calle Principal #123, Ciudad" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">👗 Código de Vestimenta</label>
                <input type="text" value={config.dressCode} onChange={(e) => handleChange('dressCode', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all bg-white/50"
                  placeholder="Ej: Rosa, Dorado o Blanco" />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-gray-100">
              <h2 className="font-bold text-gray-700 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center text-sm">3</span>
                Programa del Evento
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {config.schedule.map((item, i) => (
                <div key={i} className="flex gap-3 items-start bg-gray-50 rounded-xl p-3">
                  <div className="grid grid-cols-[60px_1fr_40px] gap-2 flex-1 items-center">
                    <input type="text" value={item.time} onChange={(e) => handleScheduleChange(i, 'time', e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm bg-white" placeholder="3:00 PM" />
                    <div className="flex gap-2">
                      <input type="text" value={item.event} onChange={(e) => handleScheduleChange(i, 'event', e.target.value)}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-sm bg-white" placeholder="Actividad" />
                      <input type="text" value={item.icon} onChange={(e) => handleScheduleChange(i, 'icon', e.target.value)}
                        className="w-8 px-1 py-1.5 rounded-lg border border-gray-200 text-sm bg-white text-center" placeholder="🎉" />
                    </div>
                    <button type="button" onClick={() => removeScheduleItem(i)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center text-xs transition-all">✕</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addScheduleItem} className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all text-sm font-medium">+ Agregar actividad</button>
            </div>
          </div>

          {/* Name Poll */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-b border-gray-100">
              <h2 className="font-bold text-gray-700 flex items-center gap-2">
                <span className="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center text-sm">4</span>
                Encuesta de Nombres
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {config.namePoll.map((name, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" value={name} onChange={(e) => handleNamePollChange(i, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white" placeholder="Nombre para el bebé" />
                  <button type="button" onClick={() => removeNamePoll(i)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center text-xs transition-all">✕</button>
                </div>
              ))}
              <button type="button" onClick={addNamePoll} className="w-full py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all text-sm font-medium">+ Agregar nombre</button>
            </div>
          </div>

          {/* Gift Registry */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-b border-gray-100">
              <h2 className="font-bold text-gray-700 flex items-center gap-2">
                <span className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center text-sm">5</span>
                Sugerencias de Regalos
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {config.giftRegistry.map((gift, i) => (
                  <div key={i} className="flex gap-1 items-center bg-gray-50 rounded-lg p-2">
                    <input type="text" value={gift.icon} onChange={(e) => handleGiftChange(i, 'icon', e.target.value)}
                      className="w-7 px-1 py-1 rounded border border-gray-200 text-sm bg-white text-center" />
                    <input type="text" value={gift.name} onChange={(e) => handleGiftChange(i, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 rounded border border-gray-200 text-xs bg-white" placeholder="Regalo" />
                    <button type="button" onClick={() => removeGift(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addGift} className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all text-sm font-medium">+ Agregar regalo</button>
            </div>
          </div>

          {/* Save */}
          <button type="submit"
            className={`w-full py-4 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg text-white ${
              saved ? 'bg-emerald-500' : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-[1.01] active:scale-[0.99]'
            }`}>
            {saved ? '✅ ¡Configuración Guardada!' : '💾 Guardar Configuración'}
          </button>
        </form>
      </main>

      {/* Seed confirmation */}
      {showSeedConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-[scaleIn_0.2s_ease-out]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center text-3xl mb-4">🎲</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Cargar datos de demostración</h3>
              <p className="text-gray-500 text-sm mb-6">Se crearán 8 invitaciones de ejemplo con respuestas RSVP, deseos y votos.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSeedConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all">Cancelar</button>
                <button onClick={handleSeed} className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg transition-all">🎲 Cargar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
