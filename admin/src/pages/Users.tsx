import { Ban, Shield, ShieldOff, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { User } from '../../../types/database';
import { supabase } from '../lib/supabase';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('users')
      .update({ is_admin: !currentStatus })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_admin: !currentStatus } : u
      ));
    }
  };

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('users')
      .update({ is_banned: !currentStatus })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_banned: !currentStatus } : u
      ));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Usuarios</h1>
        <p className="text-gray-400 mt-1">Ver y gestionar usuarios registrados</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-[#1a1a2e] rounded-2xl border border-[#2d2d44]">
          <p className="text-gray-400">No hay usuarios registrados aún.</p>
        </div>
      ) : (
        <div className="bg-[#1a1a2e] rounded-2xl border border-[#2d2d44] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d2d44]">
                <th className="text-left p-4 text-gray-400 font-medium">Usuario</th>
                <th className="text-left p-4 text-gray-400 font-medium">Instagram</th>
                <th className="text-left p-4 text-gray-400 font-medium">Edad</th>
                <th className="text-left p-4 text-gray-400 font-medium">Género</th>
                <th className="text-left p-4 text-gray-400 font-medium">Registrado</th>
                <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
                <th className="text-left p-4 text-gray-400 font-medium">Admin</th>
                <th className="text-left p-4 text-gray-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#2d2d44] last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || 'Avatar'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">
                          {user.full_name || 'Sin nombre'}
                        </p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">
                    {user.instagram_handle ? (
                      <a
                        href={`https://instagram.com/${user.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-400 hover:underline"
                      >
                        @{user.instagram_handle}
                      </a>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-300">{user.age || '-'}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.gender === 'female'
                          ? 'bg-pink-500/20 text-pink-400'
                          : user.gender === 'male'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {user.gender === 'female' ? 'Mujer' : user.gender === 'male' ? 'Hombre' : 'Otro'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{formatDate(user.created_at)}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.onboarding_complete
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {user.onboarding_complete ? 'Completo' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleAdmin(user.id, user.is_admin)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        user.is_admin
                          ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                          : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 hover:text-gray-400'
                      }`}
                      title={user.is_admin ? 'Quitar acceso admin' : 'Dar acceso admin'}
                    >
                      {user.is_admin ? <Shield size={16} /> : <ShieldOff size={16} />}
                      <span className="text-xs font-medium">
                        {user.is_admin ? 'Admin' : 'Usuario'}
                      </span>
                    </button>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleBan(user.id, user.is_banned)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        user.is_banned
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-400'
                      }`}
                      title={user.is_banned ? 'Quitar ban' : 'Banear usuario'}
                    >
                      {user.is_banned ? <Ban size={16} /> : <UserCheck size={16} />}
                      <span className="text-xs font-medium">
                        {user.is_banned ? 'Baneado' : 'Activo'}
                      </span>
                    </button>
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
