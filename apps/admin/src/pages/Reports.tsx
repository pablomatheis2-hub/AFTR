import { AlertTriangle, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ReportWithDetails {
  id: string;
  reporter_id: string;
  party_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
  reviewed_at: string | null;
  reporter: {
    full_name: string | null;
    email: string;
  };
  party: {
    title: string;
    type: 'pre' | 'after';
    host: {
      full_name: string | null;
      email: string;
    };
  };
}

const reasonLabels: Record<string, string> = {
  inappropriate: 'Contenido inapropiado',
  spam: 'Spam',
  fake: 'Fiesta falsa',
  harassment: 'Acoso',
  other: 'Otro',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  dismissed: 'Descartado',
};

export default function Reports() {
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'dismissed'>('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:users!reporter_id(full_name, email),
        party:parties!party_id(title, type, host:users!host_id(full_name, email))
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReports(data as unknown as ReportWithDetails[]);
    }
    setLoading(false);
  };

  const updateReportStatus = async (reportId: string, status: 'reviewed' | 'dismissed') => {
    const { error } = await supabase
      .from('reports')
      .update({ 
        status, 
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', reportId);

    if (!error) {
      setReports(reports.map(r =>
        r.id === reportId ? { ...r, status, reviewed_at: new Date().toISOString() } : r
      ));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter);

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">Reportes</h1>
          {pendingCount > 0 && (
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
              {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-gray-400 mt-1">Gestionar reportes de fiestas</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'reviewed', 'dismissed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === status
                ? 'bg-white text-black'
                : 'bg-[#0a0a0a] text-gray-400 hover:text-white'
            }`}
          >
            {status === 'all' ? 'Todos' : statusLabels[status]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-[#0a0a0a] rounded-2xl border border-[#262626]">
          <AlertTriangle className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-gray-400">No hay reportes {filter !== 'all' && statusLabels[filter].toLowerCase()}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-[#0a0a0a] rounded-2xl border border-[#262626] p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        report.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : report.status === 'reviewed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {statusLabels[report.status]}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                      {reasonLabels[report.reason]}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {formatDate(report.created_at)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Fiesta reportada</p>
                      <p className="text-white font-medium">{report.party?.title || 'Fiesta eliminada'}</p>
                      {report.party && (
                        <p className="text-gray-400 text-sm">
                          {report.party.type === 'pre' ? 'Previa' : 'After'} - Host: {report.party.host?.full_name || report.party.host?.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm mb-1">Reportado por</p>
                      <p className="text-white font-medium">
                        {report.reporter?.full_name || 'Usuario sin nombre'}
                      </p>
                      <p className="text-gray-400 text-sm">{report.reporter?.email}</p>
                    </div>
                  </div>

                  {report.description && (
                    <div className="mt-4 p-4 bg-black rounded-xl">
                      <p className="text-gray-500 text-sm mb-1">Descripcion</p>
                      <p className="text-gray-300">{report.description}</p>
                    </div>
                  )}
                </div>

                {report.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => updateReportStatus(report.id, 'reviewed')}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
                      title="Marcar como revisado"
                    >
                      <Check size={16} />
                      <span className="text-sm font-medium">Revisar</span>
                    </button>
                    <button
                      onClick={() => updateReportStatus(report.id, 'dismissed')}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-all"
                      title="Descartar reporte"
                    >
                      <X size={16} />
                      <span className="text-sm font-medium">Descartar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
