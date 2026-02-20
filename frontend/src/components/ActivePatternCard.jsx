import { BarChart2 } from 'lucide-react';

export default function ActivePatternCard({ data = [], filterType = 'all' }) {
    // If filterType is 'all' or 'mule_accounts', show mule pattern stats
    // If 'websites', show something else? Or just show general stats.

    // Calculate Avg Transaction
    const totalAmount = data.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const totalTx = data.reduce((sum, item) => sum + (item.txCount || 0), 0);
    const avgTx = totalTx > 0 ? (totalAmount / totalTx) : 0;

    // Max Fan-Out (uniqueSenders or uniqueReceivers max)
    const maxFanOut = data.reduce((max, item) => Math.max(max, item.uniqueSenders || 0, item.uniqueReceivers || 0), 0);

    // Key entities (top 3 by volume)
    const topEntities = [...data]
        .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
        .slice(0, 3)
        .map(e => ({
            id: e.id || e.sender_id || e.receiver_id,
            type: filterType === 'websites' ? 'SAFE' : 'MULE',
            color: filterType === 'websites' ? 'bg-blue-500' : 'bg-danger'
        }));

    const patternName = filterType === 'websites' ? 'Whitelisted' :
        filterType === 'suspected_distribution' ? 'Layering' :
            'Smurfing';

    return (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900">Active Pattern: {patternName}</h3>
                    <p className="text-xs text-gray-500">Based on {data.length} entities • Live</p>
                </div>
            </div>

            <div className="space-y-4 mb-6">
                <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5 uppercase tracking-wide text-gray-500">
                        <span>Max Fan-Out</span>
                        <span>1:{maxFanOut}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-danger rounded-full transition-all duration-500" style={{ width: `${Math.min(100, maxFanOut * 2)}%` }} />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5 uppercase tracking-wide text-gray-500">
                        <span>Avg Transaction</span>
                        <span>${avgTx.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (avgTx / 10000) * 100)}%` }} />
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Key Entities Involved</p>
                <div className="space-y-2">
                    {topEntities.length > 0 ? topEntities.map((e, i) => (
                        <EntityRow key={i} id={e.id} type={e.type} color={e.color} />
                    )) : (
                        <p className="text-xs text-gray-400 italic">No entities selected.</p>
                    )}
                </div>
            </div>


        </div>
    );
}

function EntityRow({ id, type, color }) {
    // Truncate ID
    const shortId = id && id.length > 10 ? `${id.slice(0, 5)}...${id.slice(-4)}` : id;

    return (
        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-sm font-medium text-gray-700 font-mono group-hover:text-primary transition-colors">{shortId}</span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                {type}
            </span>
        </div>
    );
}
