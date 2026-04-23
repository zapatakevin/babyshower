import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getInvitations,
  getInvitationStats,
  deleteInvitation,
  getEventConfig,
  logoutAdmin,
  exportData,
  importData,
  forceSeedDemoData,
  getWishMessages,
} from '../store';
import { Invitation, Toast } from '../types';

interface Props {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: Props) {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0, declined: 0, viewed: 0, totalGuests: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [detailInv, setDetailInv] = useState<Invitation | null>(null);
  const [activeTab, setActiveTab] = useState<'invitations' | 'activity' | 'analytics'>('invitations');
  const [totalWishes, setTotalWishes] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventConfig = getEventConfig();

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    setInvitations(getInvitations());
    setStats(getInvitationStats());
    setTotalWishes(getWishMessages().length);
  };

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const handleDelete = (id: string) => {
    deleteInvitation(id);
    setShowDeleteModal(null);
    loadData();
    addToast('Invitación eliminada correctamente', 'info');
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/invitacion/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    addToast('¡Link copiado al portapapeles!');
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const shareWhatsApp = (inv: Invitation) => {
    const url = `${window.location.origin}${window.location.pathname}#/invitacion/${inv.slug}`;
    const text = `¡Hola ${inv.guestName}! 🎀 Estás invitado/a al Baby Shower de ${eventConfig.parentNames}. Tu invitación personalizada aquí: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSeedData = () => {
    forceSeedDemoData();
    loadData();
    addToast('🎉 ¡Datos de demostración recargados!');
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `babyshower-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('📥 Datos exportados correctamente');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (importData(result)) {
        loadData();
        addToast('✅ Datos importados correctamente');
      } else {
        addToast('❌ Error al importar datos', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredInvitations = invitations
    .filter(inv => {
      if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return inv.guestName.toLowerCase().includes(term) || inv.guestLastName.toLowerCase().includes(term) || inv.slug.toLowerCase().includes(term) || inv.tableNumber.toLowerCase().includes(term);
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'declined': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return '✅ Confirmado';
      case 'declined': return '❌ Rechazado';
      default: return '⏳ Pendiente';
    }
  };

  // Activity feed
  const activities = invitations
    .filter(inv => inv.rsvpResponse || inv.viewed)
    .flatMap(inv => {
      const acts: { id: string; type: string; message: string; time: string; icon: string }[] = [];
      if (inv.viewedAt) {
        acts.push({ id: inv.id + '-view', type: 'view', message: `${inv.guestName} ${inv.guestLastName} vio la invitación`, time: inv.viewedAt, icon: '👁️' });
      }
      if (inv.rsvpResponse) {
        acts.push({ id: inv.id + '-rsvp', type: 'rsvp', message: `${inv.guestName} ${inv.guestLastName} ${inv.rsvpResponse.attending ? 'confirmó asistencia' : 'declinó la invitación'}`, time: inv.rsvpResponse.respondedAt, icon: inv.rsvpResponse.attending ? '✅' : '❌' });
      }
      return acts;
    })
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 20);

  // Chart data
  const chartMax = Math.max(stats.confirmed, stats.pending, stats.declined, 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-xl">🍼</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Baby Shower Admin</h1>
              <p className="text-xs text-gray-500">{eventConfig.parentNames}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => navigate('/admin/config')} className="px-2 sm:px-3 py-2 text-sm font-medium text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all">⚙️</button>
            <button onClick={handleExport} className="px-2 sm:px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all hidden sm:block">📥 Exportar</button>
            <button onClick={() => fileInputRef.current?.click()} className="px-2 sm:px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all hidden sm:block">📤 Importar</button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            <button onClick={() => { logoutAdmin(); onLogout(); }} className="px-2 sm:px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-all">🚪</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Invitaciones', value: stats.total, icon: '📋', color: 'from-pink-400 to-rose-500' },
            { label: 'Confirmados', value: stats.confirmed, icon: '✅', color: 'from-emerald-400 to-green-500' },
            { label: 'Pendientes', value: stats.pending, icon: '⏳', color: 'from-amber-400 to-yellow-500' },
            { label: 'Rechazados', value: stats.declined, icon: '❌', color: 'from-red-400 to-rose-500' },
            { label: 'Vistas', value: stats.viewed, icon: '👁️', color: 'from-blue-400 to-indigo-500' },
            { label: 'Total Invitados', value: stats.totalGuests, icon: '👥', color: 'from-purple-400 to-violet-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white text-sm md:text-lg mb-2 shadow-md`}>
                {stat.icon}
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Progress Bar */}
          <div className="md:col-span-2 bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">📊 Progreso de Confirmaciones</span>
              <span className="text-sm font-bold text-pink-600">{stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden flex">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-1000 shimmer" style={{ width: `${stats.total > 0 ? (stats.confirmed / stats.total) * 100 : 0}%` }} />
              <div className="h-full bg-gradient-to-r from-amber-300 to-yellow-400 transition-all duration-1000" style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }} />
              <div className="h-full bg-gradient-to-r from-red-300 to-rose-400 transition-all duration-1000" style={{ width: `${stats.total > 0 ? (stats.declined / stats.total) * 100 : 0}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {stats.confirmed} confirmados</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> {stats.pending} pendientes</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> {stats.declined} rechazados</span>
            </div>

            {/* Bar Chart */}
            <div className="mt-4 flex items-end gap-6 h-24 justify-center">
              {[
                { label: 'Confirmados', value: stats.confirmed, color: 'from-emerald-400 to-green-500' },
                { label: 'Pendientes', value: stats.pending, color: 'from-amber-400 to-yellow-500' },
                { label: 'Rechazados', value: stats.declined, color: 'from-red-400 to-rose-500' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs font-bold text-gray-700">{item.value}</span>
                  <div className="w-full relative rounded-t-lg overflow-hidden" style={{ height: `${Math.max((item.value / chartMax) * 60, 4)}px` }}>
                    <div className={`absolute inset-0 bg-gradient-to-t ${item.color} rounded-t-lg shimmer`} />
                  </div>
                  <span className="text-[10px] text-gray-500 text-center leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
            <span className="text-sm font-semibold text-gray-700 mb-3 block">⚡ Acciones Rápidas</span>
            <div className="space-y-2">
              <button onClick={() => navigate('/admin/crear')}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm">
                ✨ Nueva Invitación
              </button>
              {stats.total === 0 && (
                <button onClick={handleSeedData}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm">
                  🎲 Cargar Datos Demo
                </button>
              )}
              <button onClick={() => navigate('/admin/config')}
                className="w-full py-3 bg-white text-gray-700 font-medium rounded-xl border-2 border-gray-100 hover:border-pink-200 transition-all flex items-center justify-center gap-2 text-sm">
                ⚙️ Configuración
              </button>
              <button onClick={handleExport}
                className="w-full py-3 bg-white text-gray-700 font-medium rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all flex items-center justify-center gap-2 text-sm">
                📥 Exportar JSON
              </button>
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-white text-gray-700 font-medium rounded-xl border-2 border-gray-100 hover:border-green-200 transition-all flex items-center justify-center gap-2 text-sm">
                📤 Importar JSON
              </button>
              <div className="pt-2 border-t border-gray-100 text-center">
                <span className="text-xs text-gray-400">💌 {totalWishes} deseos en el muro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'invitations' as const, label: '📋 Invitaciones', count: filteredInvitations.length },
            { key: 'activity' as const, label: '🔔 Actividad', count: activities.length },
            { key: 'analytics' as const, label: '📊 Resumen', count: 0 },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.key ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md' : 'bg-white/70 text-gray-600 hover:bg-pink-50 border border-gray-100'}`}>
              {tab.label}
              {tab.count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100'}`}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* ===== INVITATIONS TAB ===== */}
        {activeTab === 'invitations' && (
          <>
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input type="text" placeholder="Buscar por nombre, apellido, slug o mesa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/70 backdrop-blur-sm rounded-xl border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all text-gray-700 text-sm" />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {(['all', 'pending', 'confirmed', 'declined'] as const).map((status) => (
                  <button key={status} onClick={() => setFilterStatus(status)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${filterStatus === status ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md' : 'bg-white/70 text-gray-600 hover:bg-pink-50 border border-gray-100'}`}>
                    {status === 'all' ? '📋 Todos' : status === 'pending' ? '⏳ Pendientes' : status === 'confirmed' ? '✅ Confirmados' : '❌ Rechazados'}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {filteredInvitations.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No hay invitaciones</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || filterStatus !== 'all' ? 'No se encontraron resultados.' : 'Comienza creando tu primera invitación.'}
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <div className="flex gap-3 justify-center flex-wrap">
                    <button onClick={() => navigate('/admin/crear')} className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                      ✨ Crear Primera Invitación
                    </button>
                    <button onClick={handleSeedData} className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                      🎲 Cargar Datos Demo
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredInvitations.map((inv) => (
                  <div key={inv.id} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
                      {/* Guest Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 ${
                          inv.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' :
                          inv.status === 'declined' ? 'bg-red-100 text-red-600' : 'bg-pink-100 text-pink-600'}`}>
                          {inv.guestName.charAt(0)}{inv.guestLastName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-800 truncate">{inv.guestName} {inv.guestLastName}</h3>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusColor(inv.status)}`}>{statusLabel(inv.status)}</span>
                            {inv.viewed && <span className="text-[10px] text-blue-500">👁️</span>}
                            {inv.tableNumber && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">🪑 {inv.tableNumber}</span>}
                            <span className="text-[10px] text-gray-400">👥 +{inv.plusOnes}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => copyLink(inv.slug)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${copiedSlug === inv.slug ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                          {copiedSlug === inv.slug ? '✅' : '🔗'}
                        </button>
                        <button onClick={() => shareWhatsApp(inv)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-all">💬</button>
                        <button onClick={() => navigate(`/admin/editar/${inv.id}`)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all">✏️</button>
                        <button onClick={() => setDetailInv(inv)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all">👁️</button>
                        <button onClick={() => setShowDeleteModal(inv.id)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-all">🗑️</button>
                      </div>
                    </div>

                    {/* RSVP Response */}
                    {inv.rsvpResponse && (
                      <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100">
                        <div className="flex flex-wrap gap-3 text-[10px] text-gray-600">
                          <span>📝 {new Date(inv.rsvpResponse.respondedAt).toLocaleDateString('es-ES')}</span>
                          {inv.rsvpResponse.dietaryRestrictions && <span>🍽️ {inv.rsvpResponse.dietaryRestrictions}</span>}
                          {inv.rsvpResponse.message && <span className="italic truncate max-w-[200px]">💬 "{inv.rsvpResponse.message}"</span>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== ACTIVITY TAB ===== */}
        {activeTab === 'activity' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🔔 Actividad Reciente</h3>
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔕</div>
                <p className="text-gray-500">No hay actividad registrada aún</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 via-purple-300 to-transparent" />
                <div className="space-y-3">
                  {activities.map((act) => (
                    <div key={act.id} className="flex gap-3 items-start">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-sm z-10 flex-shrink-0">
                        {act.icon}
                      </div>
                      <div className="flex-1 bg-white/60 rounded-xl p-3 shadow-sm border border-white/50">
                        <p className="text-sm text-gray-700">{act.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(act.time).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== ANALYTICS TAB ===== */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Donut Chart */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 Distribución de Respuestas</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                    {stats.total > 0 && (
                      <>
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3"
                          strokeDasharray={`${(stats.confirmed / stats.total) * 100} ${100 - (stats.confirmed / stats.total) * 100}`}
                          strokeDashoffset="0" strokeLinecap="round" className="transition-all duration-1000" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3"
                          strokeDasharray={`${(stats.pending / stats.total) * 100} ${100 - (stats.pending / stats.total) * 100}`}
                          strokeDashoffset={`-${(stats.confirmed / stats.total) * 100}`}
                          strokeLinecap="round" className="transition-all duration-1000" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3"
                          strokeDasharray={`${(stats.declined / stats.total) * 100} ${100 - (stats.declined / stats.total) * 100}`}
                          strokeDashoffset={`-${((stats.confirmed + stats.pending) / stats.total) * 100}`}
                          strokeLinecap="round" className="transition-all duration-1000" />
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
                    <span className="text-[10px] text-gray-500">Total</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <span className="flex items-center gap-1 text-xs"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Confirmados</span>
                <span className="flex items-center gap-1 text-xs"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pendientes</span>
                <span className="flex items-center gap-1 text-xs"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Rechazados</span>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="space-y-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">📈 Métricas Clave</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tasa de respuesta</span>
                    <span className="text-sm font-bold text-gray-800">{stats.total > 0 ? Math.round(((stats.confirmed + stats.declined) / stats.total) * 100) : 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tasa de visualización</span>
                    <span className="text-sm font-bold text-gray-800">{stats.total > 0 ? Math.round((stats.viewed / stats.total) * 100) : 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Promedio acompañantes</span>
                    <span className="text-sm font-bold text-gray-800">{stats.total > 0 ? (stats.totalGuests / stats.total).toFixed(1) : '0'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Deseos en el muro</span>
                    <span className="text-sm font-bold text-gray-800">{totalWishes}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">🏷️ Nombres más votados</h3>
                <div className="space-y-2">
                  {eventConfig.namePoll.slice(0, 4).map((name) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-1.5">
                          <div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-purple-500" style={{ width: '60%' }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8">0</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-[scaleIn_0.2s_ease-out]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center text-3xl mb-4">🗑️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">¿Eliminar invitación?</h3>
              <p className="text-gray-500 text-sm mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all">Cancelar</button>
                <button onClick={() => handleDelete(showDeleteModal)} className="flex-1 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-all">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailInv && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-[scaleIn_0.2s_ease-out] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 text-white relative">
              <button onClick={() => setDetailInv(null)} className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all">✕</button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                  {detailInv.guestName.charAt(0)}{detailInv.guestLastName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{detailInv.guestName} {detailInv.guestLastName}</h3>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                    detailInv.status === 'confirmed' ? 'bg-emerald-400/30 text-emerald-100' :
                    detailInv.status === 'declined' ? 'bg-red-400/30 text-red-100' : 'bg-amber-400/30 text-amber-100'
                  }`}>
                    {statusLabel(detailInv.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs text-gray-400">🪑 Mesa</span>
                  <p className="font-bold text-gray-800">{detailInv.tableNumber || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs text-gray-400">👥 Acompañantes</span>
                  <p className="font-bold text-gray-800">+{detailInv.plusOnes}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs text-gray-400">👁️ Vista</span>
                  <p className="font-bold text-gray-800">{detailInv.viewed ? `Sí · ${detailInv.viewedAt ? new Date(detailInv.viewedAt).toLocaleDateString('es-ES') : ''}` : 'No'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs text-gray-400">📅 Creada</span>
                  <p className="font-bold text-gray-800">{new Date(detailInv.createdAt).toLocaleDateString('es-ES')}</p>
                </div>
              </div>

              {detailInv.customMessage && (
                <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                  <span className="text-xs text-pink-400 font-medium">💌 Mensaje personalizado</span>
                  <p className="text-gray-700 italic mt-1">"{detailInv.customMessage}"</p>
                </div>
              )}

              {detailInv.rsvpResponse && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <span className="text-xs text-emerald-600 font-medium">📝 Respuesta RSVP</span>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>📅 Respondió: {new Date(detailInv.rsvpResponse.respondedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                    <p>👥 Acompañantes confirmados: {detailInv.rsvpResponse.plusOnesCount}</p>
                    {detailInv.rsvpResponse.dietaryRestrictions && <p>🍽️ Restricciones: {detailInv.rsvpResponse.dietaryRestrictions}</p>}
                    {detailInv.rsvpResponse.message && <p className="italic">💬 "{detailInv.rsvpResponse.message}"</p>}
                  </div>
                </div>
              )}

              {/* Link */}
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-xs text-gray-400">🔗 URL personalizada</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs text-gray-600 truncate flex-1">{window.location.origin}{window.location.pathname}#/invitacion/{detailInv.slug}</code>
                  <button onClick={() => copyLink(detailInv.slug)} className="text-xs px-2 py-1 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition-all">
                    {copiedSlug === detailInv.slug ? '✅' : '📋'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => { navigate(`/admin/editar/${detailInv.id}`); setDetailInv(null); }}
                  className="flex-1 py-2.5 bg-amber-50 text-amber-600 font-medium rounded-xl hover:bg-amber-100 transition-all text-sm">✏️ Editar</button>
                <button onClick={() => { shareWhatsApp(detailInv); setDetailInv(null); }}
                  className="flex-1 py-2.5 bg-green-50 text-green-600 font-medium rounded-xl hover:bg-green-100 transition-all text-sm">💬 WhatsApp</button>
                <a href={`#/invitacion/${detailInv.slug}`} onClick={() => setDetailInv(null)}
                  className="flex-1 py-2.5 bg-purple-50 text-purple-600 font-medium rounded-xl hover:bg-purple-100 transition-all text-sm text-center block">👁️ Ver Invitación</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className={`px-6 py-3 rounded-xl shadow-xl text-white font-medium text-sm animate-[fadeInUp_0.3s_ease-out] pointer-events-auto ${
            toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
            toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
            'bg-gradient-to-r from-blue-500 to-indigo-500'
          }`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
