import { useState, useEffect, Component } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { isAdminAuthenticated, getInvitations } from './store';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminCreateInvite from './components/AdminCreateInvite';
import AdminConfig from './components/AdminConfig';
import InvitationView from './components/InvitationView';

// store.ts auto-seeds demo data at import time — no useEffect needed here

// Error Boundary
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: '' };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message + '\n' + error.stack };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-lg text-center">
            <div className="text-5xl mb-4">😵</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Algo salió mal</h2>
            <pre className="text-xs text-red-400 bg-red-50 p-3 rounded-xl overflow-auto max-h-40 text-left mb-4">{this.state.error}</pre>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-pink-500 text-white font-bold rounded-xl">
              🔄 Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function HomePage() {
  const navigate = useNavigate();
  const [invitations] = useState(() => getInvitations());

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>

      <div className="relative text-center max-w-lg mx-auto animate-[fadeInUp_1s_ease-out]">
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-10 md:p-14 shadow-2xl border border-white/50">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-500 rounded-3xl flex items-center justify-center shadow-xl mb-6 transform rotate-6 hover:rotate-0 transition-transform duration-500">
            <span className="text-5xl">🍼</span>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-2 bg-pink-100 rounded-full mb-4">
            <span className="text-lg">🎀</span>
            <span className="text-sm font-semibold text-pink-600">Baby Shower Manager</span>
            <span className="text-lg">💖</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 bg-clip-text text-transparent mb-3 leading-tight">
            Invitaciones<br/>Personalizadas
          </h1>
          <p className="text-gray-500 mb-8 text-sm">
            Crea, administra y comparte invitaciones únicas para cada invitado
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: '✨', label: 'URL única' },
              { icon: '💌', label: 'RSVP' },
              { icon: '📊', label: 'Estadísticas' },
            ].map((f) => (
              <div key={f.label} className="bg-white/50 rounded-xl p-3">
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="text-[10px] font-medium text-gray-600">{f.label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin')}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-3"
            >
              <span className="text-2xl">🔐</span>
              Panel de Administración
            </button>
          </div>

          {invitations.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200/50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🔗 Invitaciones de Demo</p>
              <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto">
                {invitations.slice(0, 8).map((inv) => (
                  <a
                    key={inv.id}
                    href={`#/invitacion/${inv.slug}`}
                    className="px-3 py-1.5 bg-white/70 rounded-full text-xs font-medium text-pink-600 hover:bg-pink-50 transition-all border border-pink-100"
                  >
                    {inv.guestName} {inv.guestLastName}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Hecho con 💖 · Baby Shower Invitation Manager
        </p>
      </div>
    </div>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isAdminAuthenticated()) {
      setAuthenticated(true);
    }
    setChecked(true);
  }, []);

  if (!checked) return null;

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />;
  }

  return <>{children}</>;
}

function AdminLayout() {
  return (
    <AdminRoute>
      <Routes>
        <Route path="/" element={<AdminDashboard onLogout={() => { window.location.hash = '#/'; }} />} />
        <Route path="/crear" element={<AdminCreateInvite />} />
        <Route path="/editar/:id" element={<AdminCreateInvite />} />
        <Route path="/config" element={<AdminConfig />} />
      </Routes>
    </AdminRoute>
  );
}

function InvitationWrapper() {
  const { slug } = useParams<{ slug: string }>();
  return <InvitationView key={slug} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="/invitacion/:slug" element={<InvitationWrapper />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
