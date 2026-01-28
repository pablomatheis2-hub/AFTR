import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Event } from '../../../types/database';

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    address: '',
    event_date: '',
    image_url: '',
    is_active: true,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormData({ ...formData, image_url: '' }); // Clear manual URL
    }
  };

  const uploadEventImage = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    
    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `events/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('No se pudo subir la imagen.');
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Event image upload error:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Upload image if one was selected
    let finalImageUrl = formData.image_url || null;
    if (selectedFile) {
      const uploadedUrl = await uploadEventImage();
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }

    const eventData = {
      ...formData,
      image_url: finalImageUrl,
    };

    if (editingEvent) {
      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', editingEvent.id);

      if (!error) {
        fetchEvents();
        closeModal();
      }
    } else {
      const { error } = await supabase.from('events').insert(eventData);

      if (!error) {
        fetchEvents();
        closeModal();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) return;

    const { error } = await supabase.from('events').delete().eq('id', id);

    if (!error) {
      fetchEvents();
    }
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData({
      title: event.title,
      description: event.description || '',
      venue: event.venue,
      address: event.address || '',
      event_date: new Date(event.event_date).toISOString().slice(0, 16),
      image_url: event.image_url || '',
      is_active: event.is_active,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData({
      title: '',
      description: '',
      venue: '',
      address: '',
      event_date: '',
      image_url: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData({ ...formData, image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Eventos</h1>
          <p className="text-gray-400 mt-1">Gestiona tus eventos</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors"
        >
          <Plus size={20} />
          Agregar Evento
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-[#0a0a0a] rounded-2xl border border-[#262626]">
          <p className="text-gray-400">No hay eventos. Crea tu primer evento.</p>
        </div>
      ) : (
        <div className="bg-[#0a0a0a] rounded-2xl border border-[#262626] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#262626]">
                <th className="text-left p-4 text-gray-400 font-medium">Evento</th>
                <th className="text-left p-4 text-gray-400 font-medium">Lugar</th>
                <th className="text-left p-4 text-gray-400 font-medium">Fecha</th>
                <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
                <th className="text-right p-4 text-gray-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-[#262626] last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#262626]" />
                      )}
                      <span className="text-white font-medium">{event.title}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">{event.venue}</td>
                  <td className="p-4 text-gray-300">{formatDate(event.event_date)}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {event.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(event)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0a0a] rounded-2xl border border-[#262626] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#262626]">
              <h2 className="text-xl font-semibold text-white">
                {editingEvent ? 'Editar Evento' : 'Crear Evento'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111111] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111111] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lugar
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111111] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111111] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha y Hora
                </label>
                <input
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111111] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Imagen del Evento
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-[#111111] border border-[#262626] rounded-xl overflow-hidden cursor-pointer hover:border-gray-500 transition-colors"
                >
                  {previewUrl || formData.image_url ? (
                    <div className="relative">
                      <img
                        src={previewUrl || formData.image_url}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center gap-2 text-gray-500">
                      <ImageIcon size={32} />
                      <span className="text-sm">Click para seleccionar imagen</span>
                    </div>
                  )}
                </div>
                {(previewUrl || formData.image_url) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage();
                    }}
                    className="mt-2 text-sm text-red-400 hover:text-red-300"
                  >
                    Eliminar imagen
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded bg-[#111111] border-[#262626] text-white focus:ring-white"
                />
                <label htmlFor="is_active" className="text-gray-300">
                  Evento activo
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={uploading}
                  className="flex-1 py-3 px-4 bg-[#111111] text-gray-300 font-semibold rounded-xl hover:bg-[#262626] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3 px-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    editingEvent ? 'Actualizar' : 'Crear'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
