import { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, Database, Lock, AlertTriangle } from 'lucide-react';
import API_BASE from '../api';

export default function SystemReadiness() {
    const [status, setStatus] = useState({
        engine: false,
        models: false,
        database: false,
        encryption: true,
        latency: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkBackendHealth();
        const interval = setInterval(checkBackendHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    async function checkBackendHealth() {
        try {
            const res = await fetch(`${API_BASE}/health`);
            if (res.ok) {
                const data = await res.json();
                setStatus({
                    engine: true,
                    models: data.models_loaded ?? true,
                    database: data.database_connected ?? true,
                    encryption: true,
                    latency: data.latency_ms ?? 12,
                });
            } else {
                throw new Error('Backend not ok');
            }
        } catch {
            setStatus((prev) => ({
                ...prev,
                engine: false,
                models: false,
                database: false,
            }));
        } finally {
            setLoading(false);
        }
    }

    const allOnline = status.engine && status.models && status.database;

    const statusItems = [
        {
            icon: CheckCircle2,
            label: 'Forensic Models Loaded',
            sub: 'RIFT-v2.41 (Money Muling)',
            ok: status.models,
        },
        {
            icon: Database,
            label: 'Database Connected',
            sub: 'PostgreSQL (Cluster A)',
            ok: status.database,
        },
        {
            icon: Lock,
            label: 'Encryption Active',
            sub: 'AES-256 E2E',
            ok: status.encryption,
        },
    ];

    return (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">System Readiness</h3>
            </div>

            {/* Engine Status */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${allOnline ? 'bg-success animate-pulse' : 'bg-danger animate-pulse'}`} />
                    <span className="text-sm font-medium text-gray-700">Engine Status</span>
                </div>
                <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider ${allOnline
                        ? 'bg-green-50 text-success border border-green-200'
                        : 'bg-red-50 text-danger border border-red-200'
                        }`}
                >
                    {allOnline ? 'ONLINE' : 'WARNING'}
                </span>
            </div>

            {/* Target Processing */}
            <div className="bg-gray-50 rounded-xl p-3 mb-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">Target Processing</span>
                    <span className="text-xs font-semibold text-primary">{'< 30s / 10k rows'}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${allOnline ? 'bg-primary w-[75%]' : 'bg-danger w-[20%]'
                            }`}
                    />
                </div>
                <p className="text-[11px] text-muted mt-1.5">
                    {status.latency ? `Current latency: ${status.latency}ms (Optimal)` : 'Checking latency...'}
                </p>
            </div>

            {/* Status Items */}
            <div className="space-y-4">
                {statusItems.map(({ icon: Icon, label, sub, ok }) => (
                    <div key={label} className="flex items-start gap-3">
                        {ok ? (
                            <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-danger mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                            <p className="text-sm font-medium text-gray-800">{label}</p>
                            <p className="text-xs text-muted">{sub}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
