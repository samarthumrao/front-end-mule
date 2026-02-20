import { Search, Download, Bell, User } from 'lucide-react';

import API_BASE from '../api';

export default function DashboardHeader() {
    return (
        <header className="bg-white px-8 py-4 border-b border-border flex items-center justify-between sticky top-0 z-30">
            {/* Title */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analysis Dashboard</h1>
                <p className="text-sm text-gray-500">Monitoring active money muling rings and suspicious transaction cycles in real-time.</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6">
                {/* Actions */}

                {/* Download Button */}
                <button
                    onClick={() => window.location.href = `${API_BASE}/export/json`}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
                >
                    <Download className="w-4 h-4" />
                    Download JSON
                </button>


            </div>
        </header>
    );
}
