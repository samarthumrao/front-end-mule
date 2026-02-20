import { Info, Play } from 'lucide-react';

export default function ActionBar({ hasFile, onAnalyze, onCancel, loading }) {
    return (
        <div className="bg-white rounded-2xl border border-border p-4 flex items-center justify-between shadow-sm">
            {/* Info */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-800">Ready for analysis</p>
                    <p className="text-xs text-muted">Upload a file to enable the forensic engine.</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onCancel}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    disabled={!hasFile || loading}
                    onClick={onAnalyze}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm ${hasFile && !loading
                            ? 'bg-primary text-white hover:bg-primary-dark shadow-primary/20 cursor-pointer'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    <Play className="w-3.5 h-3.5" fill="currentColor" />
                    {loading ? 'Analyzing...' : 'Analyze Data'}
                </button>
            </div>
        </div>
    );
}
