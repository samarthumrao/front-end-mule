export default function DetectedRingsTable({ rings = [], filterType = 'all' }) {
    // Filter rings based on type if needed, or show all top rings
    // Backend rings have: { ring_id, nodes: [], risk_score, pattern_type, ... }

    const displayRings = rings.slice(0, 5).map((ring, i) => {
        return {
            id: `#${ring.ring_id}`,
            type: ring.pattern_type || (filterType === 'websites' ? 'Safelist' : 'Smurfing'),
            vol: `$${(ring.total_volume || 0).toLocaleString(undefined, { maximumFractionDigits: 1, notation: "compact" })}`,
            nodes: ring.nodes ? ring.nodes.length : 0,
            risk: Math.round(ring.risk_score),
            color: ring.risk_score > 90 ? 'bg-danger' : ring.risk_score > 80 ? 'bg-orange-500' : 'bg-yellow-500'
        };
    });

    return (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Detected Rings Summary</h3>
                <button className="px-3 py-1.5 bg-blue-50 text-primary text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors">
                    View All Analysis
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ring ID</th>
                            <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pattern Type</th>
                            <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Vol.</th>
                            <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nodes</th>
                            <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-1/4">Risk Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {displayRings.length > 0 ? displayRings.map((row) => (
                            <tr key={row.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="py-3 text-sm font-medium text-gray-600 font-mono group-hover:text-gray-900">{row.id}</td>
                                <td className="py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${row.type === 'Circular' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                        row.type === 'Smurfing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            'bg-gray-100 text-gray-600 border-gray-200'
                                        }`}>
                                        {row.type}
                                    </span>
                                </td>
                                <td className="py-3 text-sm font-bold text-gray-900">{row.vol}</td>
                                <td className="py-3 text-sm text-gray-500">{row.nodes}</td>
                                <td className="py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.risk}%` }} />
                                        </div>
                                        <span className={`text-xs font-bold ${row.risk > 90 ? 'text-danger' : row.risk > 80 ? 'text-orange-600' : 'text-yellow-600'
                                            }`}>
                                            {row.risk}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" className="py-4 text-center text-xs text-gray-400">No data for selected cluster.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
