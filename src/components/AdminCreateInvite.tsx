import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getInvitationById, saveInvitation, generateId, generateSlug } from '../store';
import { Invitation } from '../types';

export default function AdminCreateInvite() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    guestName: '',
    guestLastName: '',
    customMessage: '',
    plusOnes: 0,
    tableNumber: '',
  });
  const [previewSlug, setPreviewSlug] = useState('');
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing) {
      const inv = getInvitationById(id!);
      if (inv) {
        setFormData({
          guestName: inv.guestName,
          guestLastName: inv.guestLastName,
          customMessage: inv.customMessage,
          plusOnes: inv.plusOnes,
          tableNumber: inv.tableNumber,
        });
        setPreviewSlug(inv.slug);
      } else {
        navigate('/admin/dashboard');
      }
    }
  }, [id, isEditing, navigate]);

  useEffect(() => {
    if (!isEditing) {
      const slug = generateSlug(formData.guestName, formData.guestLastName);
      setPreviewSlug(slug);
    }
  }, [formData.guestName, formData.guestLastName, isEditing]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.guestName.trim()) newErrors.guestName = 'El nombre es obligatorio';
    if (!formData.guestLastName.trim()) newErrors.guestLastName = 'El apellido es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const invitation: Invitation = {
      id: isEditing ? id! : generateId(),
      slug: isEditing ? previewSlug : generateSlug(formData.guestName, formData.guestLastName),
      guestName: formData.guestName.trim(),
      guestLastName: formData.guestLastName.trim(),
      customMessage: formData.customMessage.trim(),
      plusOnes: formData.plusOnes,
      tableNumber: formData.tableNumber.trim(),
      status: 'pending',
      createdAt: isEditing ? getInvitationById(id!)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewed: isEditing ? getInvitationById(id!)?.viewed || false : false,
      viewedAt: isEditing ? getInvitationById(id!)?.viewedAt : undefined,
      rsvpResponse: isEditing ? getInvitationById(id!)?.rsvpResponse : undefined,
    };

    saveInvitation(invitation);
    setSaved(true);
    setTimeout(() => {
      navigate('/admin/dashboard');
    }, 1500);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const previewUrl = `${window.location.origin}${window.location.pathname}#/invitacion/${previewSlug}`;

  const messageTemplates = [
    '¡Tu presencia es el mejor regalo! 🎁',
    '¡Nos encantaría compartir este momento contigo! 💕',
    '¡Eres parte especial de nuestra familia! 👨‍👩‍👧',
    '¡No puede faltar tu alegría en este día! 🎉',
    '¡Ven a celebrar con nosotros esta nueva vida! 🍼',
    '¡Tu amor y compañía son todo lo que necesitamos! 💖',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              {isEditing ? '✏️ Editar Invitación' : '✨ Crear Nueva Invitación'}
            </h1>
            <p className="text-xs text-gray-500">
              {isEditing ? 'Modifica los datos de la invitación' : 'Personaliza la invitación para tu invitado'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Guest Info Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-gray-100">
              <h2 className="font-bold text-gray-700 flex items-center gap-2">
                <span className="w-8 h-8 bg-pink-500 text-white rounded-lg flex items-center justify-center text-sm">1</span>
                Información del Invitado
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">👤 Nombre *</label>
                  <input
                    type="text"
                    value={formData.guestName}
                    onChange={(e) => handleChange('guestName', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${errors.guestName ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-pink-300'} focus:ring-4 focus:ring-pink-50 outline-none transition-all bg-white/50`}
                    placeholder="Ej: María"
                  />
                  {errors.guestName && <p className="text-red-500 text-xs mt-1">{errors.guestName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">👤 Apellido *</label>
                  <input
                    type="text"
                    value={formData.guestLastName}
                    onChange={(e) => handleChange('guestLastName', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${errors.guestLastName ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-pink-300'} focus:ring-4 focus:ring-pink-50 outline-none transition-all bg-white/50`}
                    placeholder="Ej: García"
                  />
                  {errors.guestLastName && <p className="text-red-500 text-xs mt-1">{errors.guestLastName}</p>}
                </div>
              </div>

              {/* URL Preview */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">🔗 URL Personalizada</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 px-4 py-3 rounded-xl border-2 border-gray-100 text-sm text-gray-600 font-mono truncate">
                    {previewUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(previewUrl);
                    }}
                    className="px-4 py-3 bg-pink-100 text-pink-600 rounded-xl hover:bg-pink-200 transition-all text-sm font-medium flex-shrink-0"
                  >
                    📋 Copiar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">👥 Acompañantes</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange('plusOnes', Math.max(0, formData.plusOnes - 1))}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg font-bold transition-all"
                    >
                      −
                    </button>
                    <span className="text-2xl font-bold text-gray-800 w-12 text-center">{formData.plusOnes}</span>
                    <button
                      type="button"
                      onClick={() => handleChange('plusOnes', formData.plusOnes + 1)}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-lg font-bold transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">🪑 Número de Mesa</label>
                  <input
                    type="text"
                    value={formData.tableNumber}
                    onChange={(e) => handleChange('tableNumber', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-300 focus:ring-4 focus:ring-pink-50 outline-none transition-all bg-white/50"
                    placeholder="Ej: 5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom Message Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-gray-100">
              <h2 className="font-bold text-gray-700 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-500 text-white rounded-lg flex items-center justify-center text-sm">2</span>
                Mensaje Personalizado
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">💌 Mensaje especial para el invitado</label>
                <textarea
                  value={formData.customMessage}
                  onChange={(e) => handleChange('customMessage', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-300 focus:ring-4 focus:ring-purple-50 outline-none transition-all bg-white/50 resize-none"
                  placeholder="Escribe un mensaje personalizado para este invitado..."
                />
              </div>

              {/* Template Messages */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">💡 Mensajes rápidos:</label>
                <div className="flex flex-wrap gap-2">
                  {messageTemplates.map((msg) => (
                    <button
                      key={msg}
                      type="button"
                      onClick={() => handleChange('customMessage', msg)}
                      className="text-xs px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-all border border-purple-100"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 to-pink-500/10 border-b border-gray-100">
              <h2 className="font-bold text-gray-700 flex items-center gap-2">
                <span className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center text-sm">3</span>
                Vista Previa de la Tarjeta
              </h2>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-100 max-w-sm mx-auto">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md">
                    {formData.guestName ? formData.guestName.charAt(0).toUpperCase() : '?'}
                    {formData.guestLastName ? formData.guestLastName.charAt(0).toUpperCase() : '?'}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {formData.guestName || 'Nombre'} {formData.guestLastName || 'Apellido'}
                  </h3>
                  {formData.customMessage && (
                    <p className="text-sm text-gray-600 italic mt-2">"{formData.customMessage}"</p>
                  )}
                  <div className="flex justify-center gap-3 mt-3">
                    {formData.plusOnes > 0 && (
                      <span className="text-xs bg-white/80 text-gray-600 px-2 py-1 rounded-full">
                        👥 +{formData.plusOnes}
                      </span>
                    )}
                    {formData.tableNumber && (
                      <span className="text-xs bg-white/80 text-gray-600 px-2 py-1 rounded-full">
                        🪑 Mesa {formData.tableNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saved}
              className={`flex-1 py-4 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg text-white ${
                saved
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {saved ? '✅ ¡Guardado!' : isEditing ? '💾 Guardar Cambios' : '✨ Crear Invitación'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
