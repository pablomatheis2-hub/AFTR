import { useEffect, useState } from 'react';
import { Calendar, Users, PartyPopper, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Stats {
  totalEvents: number;
  totalUsers: number;
  totalParties: number;
  activeEvents: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    totalUsers: 0,
    totalParties: 0,
    activeEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [eventsRes, usersRes, partiesRes, activeEventsRes] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('parties').select('*', { count: 'exact', head: true }),
      supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString()),
    ]);

    setStats({
      totalEvents: eventsRes.count || 0,
      totalUsers: usersRes.count || 0,
      totalParties: partiesRes.count || 0,
      activeEvents: activeEventsRes.count || 0,
    });
    setLoading(false);
  };

  const statCards = [
    {
      title: 'Total Eventos',
      value: stats.totalEvents,
      icon: Calendar,
    },
    {
      title: 'Eventos Activos',
      value: stats.activeEvents,
      icon: TrendingUp,
    },
    {
      title: 'Total Usuarios',
      value: stats.totalUsers,
      icon: Users,
    },
    {
      title: 'Total Fiestas',
      value: stats.totalParties,
      icon: PartyPopper,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
        <p className="text-gray-400 mt-1">Bienvenido al panel de administración de AFTR</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-[#0a0a0a] rounded-2xl p-6 border border-[#262626]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/10 p-3 rounded-xl">
                  <Icon className="text-white" size={24} />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{card.title}</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {loading ? '...' : card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-[#0a0a0a] rounded-2xl border border-[#262626] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/events"
            className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Calendar className="text-white" size={20} />
            <span className="text-white font-medium">Gestionar Eventos</span>
          </a>
          <a
            href="/users"
            className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Users className="text-white" size={20} />
            <span className="text-white font-medium">Ver Usuarios</span>
          </a>
          <a
            href="/parties"
            className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <PartyPopper className="text-white" size={20} />
            <span className="text-white font-medium">Ver Fiestas</span>
          </a>
        </div>
      </div>
    </div>
  );
}
