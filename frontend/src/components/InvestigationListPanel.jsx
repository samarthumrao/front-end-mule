import { Search, Filter, ArrowRight, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function InvestigationListPanel({ selectedId, onSelect }) {
    const [suspects, setSuspects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ circular: true, smurfing: true });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setLoading(true);
        fetch('/api/investigation/suspects')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch suspects');
                return res.json();
            })
            .then(data => {
                setSuspects(data);
                if (data.length > 0 && !selectedId && onSelect) {
                    onSelect(data[0].id); // Auto-select first
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading suspects:", err);
                setError(err.message);
                setLoading(false);
            });
    }, []); // Run once on mount

    const filteredSuspects = suspects.filter(suspect => {
        // 1. Search Filter
        if (!suspect || !suspect.id) return false;
        if (searchTerm && !suspect.id.toString().toLowerCase().includes(searchTerm.toLowerCase())) return false;

        // 2. Pattern Filter
        // If suspect has NO patterns, it's effectively "Other". 
        // We only filter if the suspect HAS one of the specific patterns we are toggling.
        // Logic: Show if (Circular checked AND has Circular) OR (Smurfing checked AND has Smurfing)
        // Or simpler: true if any of its patterns are enabled.
        // If it has NO patterns, we typically show it unless there's an "Other" filter. 
        // But for this UI, let's assume all suspects have one of these if they are "High Risk" enough to be here.
        // Let's implement: Match ANY enabled filter.

        const hasCircular = suspect.patterns?.includes('Circular');
        const hasSmurfing = suspect.patterns?.includes('Smurfing');

        if (!hasCircular && !hasSmurfing) return true; // Show items that don't match these specific categories (safe fallback)

        if (hasCircular && filters.circular) return true;
        if (hasSmurfing && filters.smurfing) return true;

        return false;
    });

    if (loading) {
        // ... existing loading block
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white border-r border-border w-full">
                <Loader className="w-6 h-6 animate-spin mb-2" />
                <span className="text-xs">Loading suspects...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-danger bg-white border-r border-border w-full p-4 text-center">
                <span className="text-xs font-bold">Error loading data</span>
                <span className="text-[10px] text-gray-500 mt-1">{error}</span>
            </div>
        );
    }

    if (suspects.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white border-r border-border w-full p-4 text-center">
                <span className="text-xs">No suspicious activity detected yet.</span>
                <span className="text-[10px] text-gray-500 mt-1">Upload data to begin analysis.</span>
            </div>
        );
    }

    return (
        <div className="bg-white border-r border-border h-full flex flex-col w-full">
            {/* Pattern Filters */}
            <div className="p-4 border-b border-border">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Pattern Filters</p>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={filters.circular}
                                onChange={(e) => setFilters(prev => ({ ...prev, circular: e.target.checked }))}
                                className="peer h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                            />
                        </div>
                        <span className="text-sm text-gray-700 font-medium group-hover:text-primary transition-colors">Circular Routing</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={filters.smurfing}
                            onChange={(e) => setFilters(prev => ({ ...prev, smurfing: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 font-medium group-hover:text-primary transition-colors">Smurfing Patterns</span>
                    </label>
                </div>
            </div>

            {/* Suspect Investigation List */}
            <div className="p-4 flex-1 flex flex-col overflow-hidden">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Suspect Investigation</p>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Filter suspects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary transition-colors"
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {filteredSuspects.map((suspect) => {
                        const isSelected = selectedId === suspect.id;
                        return (
                            <div
                                key={suspect.id}
                                onClick={() => onSelect && onSelect(suspect.id)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer ${isSelected
                                    ? 'bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-100'
                                    : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-sm font-bold font-mono ${isSelected ? 'text-primary' : 'text-gray-900'}`}>{suspect.id}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${(suspect.score || 0) > 90 ? 'bg-red-50 text-danger' :
                                        (suspect.score || 0) > 70 ? 'bg-orange-50 text-orange-600' : 'bg-yellow-50 text-yellow-600'
                                        }`}>
                                        {Math.round(suspect.score || 0)}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-2 truncate">{suspect.cluster || 'Unknown Cluster'}</p>

                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-400">Linked: {suspect.nodes} Nodes</span>
                                    {isSelected && (
                                        <span className="text-[9px] font-bold text-danger uppercase tracking-wider flex items-center gap-1 animate-pulse">
                                            <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                                            Focusing
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-border bg-gray-50/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Graph Legend</p>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-danger" />
                        <span className="text-[11px] text-gray-600">High-Risk Mule</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[11px] text-gray-600">Related (Layering)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-[11px] text-gray-600">Neutral Entity</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="text-[11px] text-gray-600">Flow Direction</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
