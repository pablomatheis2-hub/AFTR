import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Party, User, Event } from '../../../types/database';

type PartyWithDetails = Party & {
  host: User;
  event: Event;
};

export default function Parties() {
  const [parties, setParties] = useState<PartyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    const { data, error } = await supabase
      .from('parties')
      .select('*, host:users!host_id(*), event:events!event_id(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setParties(data as PartyWithDetails[]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta fiesta?')) return;

    const { error } = await supabase.from('parties').delete().eq('id', id);

    if (!error) {
      fetchParties();
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Fiestas</h1>
        <p className="text-gray-400 mt-1">Ver y moderar fiestas creadas por usuarios</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : parties.length === 0 ? (
        <div className="text-center py-12 bg-[#1a1a2e] rounded-2xl border border-[#2d2d44]">
          <p className="text-gray-400">No hay fiestas creadas aún.</p>
        </div>
      ) : (
        <div className="bg-[#1a1a2e] rounded-2xl border border-[#2d2d44] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d2d44]">
                <th className="text-left p-4 text-gray-400 font-medium">Fiesta</th>
                <th className="text-left p-4 text-gray-400 font-medium">Tipo</th>
                <th className="text-left p-4 text-gray-400 font-medium">Evento</th>
                <th className="text-left p-4 text-gray-400 font-medium">Anfitrión</th>
                <th className="text-left p-4 text-gray-400 font-medium">Fecha</th>
                <th className="text-left p-4 text-gray-400 font-medium">Edad</th>
                <th className="text-right p-4 text-gray-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {parties.map((party) => (
                <tr key={party.id} className="border-b border-[#2d2d44] last:border-0">
                  <td className="p-4">
                    <div>
                      <p className="text-white font-medium">{party.title}</p>
                      <p className="text-gray-400 text-sm truncate max-w-xs">
                        {party.address}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        party.type === 'pre'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-pink-500/20 text-pink-400'
                      }`}
                    >
                      {party.type === 'pre' ? 'Previa' : 'After'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{party.event?.title || '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {party.host?.avatar_url ? (
                        <img
                          src={party.host.avatar_url}
                          alt={party.host.full_name || 'Host'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {party.host?.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      <span className="text-gray-300">
                        {party.host?.full_name || 'Desconocido'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">{formatDate(party.start_time)}</td>
                  <td className="p-4 text-gray-300">
                    {party.min_age}-{party.max_age}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleDelete(party.id)}
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
    </div>
  );
}
