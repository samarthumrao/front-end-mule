import { Info } from 'lucide-react';

export default function RiskScoreDistribution({ data = [] }) {
    // Compute histogram buckets from real data
    // Since we don't have a real "risk score" in the data, we'll simulate one mostly for decoration
    // OR we can calculate a heuristic score: (txCount * uniqueSenders) clamped to 100

    const calculateRisk = (item) => {
        // Simple heuristic for visualization
        const tx = item.txCount || 0;
        const senders = item.uniqueSenders || 0;
        const score = Math.min(100, (tx * senders * 2));
        return score;
    };

    const scores = data.map(item => calculateRisk(item));

    // Create buckets: 0-12.5, 12.5-25 ... 87.5-100 (8 buckets)
    const buckets = Array(8).fill(0);
    scores.forEach(s => {
        const bucketIndex = Math.min(7, Math.floor(s / 12.5));
        buckets[bucketIndex]++;
    });

    const maxVal = Math.max(...buckets, 1); // Avoid div by zero

    const bars = buckets.map((count, i) => ({
        height: `${(count / maxVal) * 90}%`,
        label: i % 2 === 0 ? (i * 12.5).toFixed(0) : ''
    }));

    const entityCount = data.length;

    return (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Risk Score Distribution</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Frequency of risk scores across {entityCount.toLocaleString()} entities.
                    </p>
                </div>
                <Info className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>

            <div className="flex-1 flex items-end justify-between gap-2 mt-4 px-2 border-b border-gray-100 pb-2">
                {bars.map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end">
                        <div
                            className={`w-full rounded-t-sm transition-all duration-500 group-hover:opacity-80 min-h-[4px] ${i > 6 ? 'bg-danger' : i > 4 ? 'bg-warning' : i > 2 ? 'bg-blue-300' : 'bg-gray-200'
                                }`}
                            style={{ height: bar.height || '4px' }}
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1 font-medium">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
            </div>
        </div>
    );
}
