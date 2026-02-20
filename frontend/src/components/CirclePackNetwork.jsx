import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Plus, Minus, Scan, LayoutGrid, Link2 } from 'lucide-react';

const COLORS = {
    website: { fill: '#3b82f6', stroke: '#2563eb', label: 'Whitelist' },
    mule: { fill: '#ef4444', stroke: '#dc2626', label: 'Mule Accounts' },
    suspected: { fill: '#f59e0b', stroke: '#d97706', label: 'Suspected Distribution' },
};

export default function CirclePackNetwork({ data, selectedCluster = 'all', onSelectCluster }) {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [tooltip, setTooltip] = useState(null);
    const [viewMode, setViewMode] = useState('packed'); // 'packed' | 'links'
    const [zoomLevel, setZoomLevel] = useState(1);

    // Re-run D3 logic when data or viewMode/zoom/selectedCluster changes
    useEffect(() => {
        if (!data || !svgRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = Math.max(500, width * 0.7);

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous

        svg.attr('width', width).attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);

        // Create a group for zooming
        const g = svg.append('g');

        // Simple zoom handler
        const zoomhandler = d3.zoom()
            .scaleExtent([0.5, 5])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                setZoomLevel(event.transform.k);
            });

        svg.call(zoomhandler);

        // Build hierarchy
        const root = d3.hierarchy(buildHierarchy(data))
            .sum((d) => d.value || 1)
            .sort((a, b) => b.value - a.value);

        const pack = d3.pack().size([width - 40, height - 40]).padding(12);
        pack(root);

        // Draw circles using the data
        const nodes = g.selectAll('circle')
            .data(root.descendants())
            .enter()
            .append('circle')
            .attr('cx', (d) => d.x + 20)
            .attr('cy', (d) => d.y + 20)
            .attr('r', (d) => d.r)
            .attr('fill', (d) => {
                if (d.depth === 0) return '#f8fafc'; // Root background

                // Highlight logic
                const category = d.data.category || d.parent?.data.category;
                const isSelected = selectedCluster === 'all' ||
                    (category === 'mule' && selectedCluster === 'mule_accounts') ||
                    (category === 'suspected' && selectedCluster === 'suspected_distribution') ||
                    (category === 'website' && selectedCluster === 'websites');

                if (!isSelected) return '#f1f5f9'; // Dimmed

                if (d.depth === 1) return COLORS[d.data.category]?.fill + '15'; // Cluster bg
                return COLORS[d.parent?.data.category]?.fill || '#94a3b8'; // Node fill
            })
            .attr('stroke', (d) => {
                if (d.depth === 0) return '#e2e8f0';

                const category = d.data.category || d.parent?.data.category;
                const isSelected = selectedCluster === 'all' ||
                    (category === 'mule' && selectedCluster === 'mule_accounts') ||
                    (category === 'suspected' && selectedCluster === 'suspected_distribution') ||
                    (category === 'website' && selectedCluster === 'websites');

                if (!isSelected) return '#e2e8f0';

                if (d.depth === 1) return COLORS[d.data.category]?.stroke + '40';
                return '#ffffff';
            })
            .attr('stroke-width', (d) => d.depth === 0 ? 1 : d.depth === 1 ? 1 : 2)
            .style('cursor', (d) => d.depth > 0 ? 'pointer' : 'default')
            .on('click', (event, d) => {
                if (d.depth === 1 && onSelectCluster) {
                    // Click on cluster bubble
                    const name = d.data.name;
                    // Mapping back from d.data.name to cluster key
                    // buildHierarchy uses keys: 'websites', 'mule_accounts', 'suspected_distribution'
                    if (['mule_accounts', 'suspected_distribution', 'websites'].includes(name)) {
                        onSelectCluster(name);
                        event.stopPropagation();
                    }
                } else if (d.depth === 0 && onSelectCluster) {
                    onSelectCluster('all');
                }
            })
            .on('mouseenter', function (event, d) {
                if (d.depth > 1) { // Only tooltip leaf nodes
                    // Check if parent selected or all selected
                    const category = d.parent?.data.category;
                    const isSelected = selectedCluster === 'all' ||
                        (category === 'mule' && selectedCluster === 'mule_accounts') ||
                        (category === 'suspected' && selectedCluster === 'suspected_distribution') ||
                        (category === 'website' && selectedCluster === 'websites');

                    if (isSelected) {
                        d3.select(this)
                            .transition().duration(200)
                            .attr('stroke', '#1e293b')
                            .attr('stroke-width', 3);

                        const [x, y] = d3.pointer(event, svgRef.current);

                        setTooltip({
                            x: x,
                            y: y,
                            id: d.data.name || d.data.id,
                            category: COLORS[d.parent?.data.category]?.label,
                            volume: d.data.totalAmount,
                            transactions: d.data.txCount,
                            isRisk: d.parent?.data.category === 'mule'
                        });
                    }
                }
            })
            .on('mouseleave', function (event, d) {
                if (d.depth > 1) {
                    d3.select(this)
                        .transition().duration(200)
                        .attr('stroke', '#ffffff')
                        .attr('stroke-width', 2);
                    setTooltip(null);
                }
            });

        // Icons for cloud centers
        g.selectAll('.cluster-icon')
            .data(root.descendants().filter(d => d.depth === 1))
            .enter()
            .append('text')
            .attr('class', 'cluster-icon')
            .attr('x', d => d.x + 20)
            .attr('y', d => d.y + 20)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .style('font-size', '24px')
            .attr('fill', d => {
                const category = d.data.category;
                const isSelected = selectedCluster === 'all' ||
                    (category === 'mule' && selectedCluster === 'mule_accounts') ||
                    (category === 'suspected' && selectedCluster === 'suspected_distribution') ||
                    (category === 'website' && selectedCluster === 'websites');
                return isSelected ? COLORS[d.data.category]?.stroke : '#94a3b8';
            })
            .attr('opacity', d => {
                const category = d.data.category;
                const isSelected = selectedCluster === 'all' ||
                    (category === 'mule' && selectedCluster === 'mule_accounts') ||
                    (category === 'suspected' && selectedCluster === 'suspected_distribution') ||
                    (category === 'website' && selectedCluster === 'websites');
                return isSelected ? 0.5 : 0.2;
            })
            .text(d => {
                if (d.data.category === 'mule') return '⚠️';
                if (d.data.category === 'suspected') return '👁️';
                return '🌐';
            });

    }, [data, viewMode, selectedCluster]);

    return (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 z-10 relative">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Scan className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-gray-900">Circle Packing Network</h3>
                    </div>
                </div>

                {/* Right Side Controls */}
                <div className="flex items-center gap-2">
                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['all', 'mule_accounts', 'suspected_distribution', 'websites'].map(key => {
                            const label = key === 'all' ? 'All' : key === 'mule_accounts' ? 'Mules' : key === 'suspected_distribution' ? 'Suspected' : 'Whitelist';
                            const isActive = selectedCluster === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => onSelectCluster && onSelectCluster(key)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {label}
                                </button>
                            )
                        })}
                    </div>

                    {/* View Toggles */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('packed')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'packed' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Packed View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('links')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'links' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Raw Links"
                        >
                            <Link2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div ref={containerRef} className="flex-1 w-full h-full min-h-[500px] overflow-hidden rounded-xl bg-slate-50 relative">
                <svg ref={svgRef} className="block w-full h-full touch-pan-x touch-pan-y" style={{ maxWidth: '100%', maxHeight: '100%' }} />

                {/* Zoom Controls */}
                <div className="absolute right-4 bottom-4 flex flex-col gap-2 bg-white rounded-lg shadow-sm border border-gray-100 p-1">
                    <button
                        className="p-1.5 hover:bg-gray-50 rounded text-gray-500 hover:text-primary transition-colors"
                        onClick={() => {
                            const svg = d3.select(svgRef.current);
                            svg.transition().duration(300).call(d3.zoom().transform, d3.zoomIdentity.scale(zoomLevel * 1.2));
                        }}
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        className="p-1.5 hover:bg-gray-50 rounded text-gray-500 hover:text-primary transition-colors"
                        onClick={() => {
                            const svg = d3.select(svgRef.current);
                            svg.transition().duration(300).call(d3.zoom().transform, d3.zoomIdentity.scale(zoomLevel / 1.2));
                        }}
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                </div>

                {/* Legend */}
                <div className="absolute left-4 bottom-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-gray-100 shadow-sm text-xs">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-600">Network Scope</span>
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-mono">
                            {(data?.clusters?.mule_accounts?.length || 0) + (data?.clusters?.suspected_distribution?.length || 0) + (data?.clusters?.websites?.length || 0)} Nodes
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        {Object.entries(COLORS).map(([key, style]) => (
                            <div key={key} className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.fill, border: `1px solid ${style.stroke}` }} />
                                <span className="text-gray-500">{style.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tooltip Card */}
                {tooltip && (
                    <div
                        className="absolute bg-white p-4 rounded-xl shadow-xl border border-gray-100 w-64 pointer-events-none z-50 transform transition-all duration-200"
                        style={{
                            left: tooltip.x + 20,
                            top: tooltip.y - 20,
                        }}
                    >
                        <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-50">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Entity ID</p>
                                <p className="text-sm font-bold text-gray-900 font-mono break-all leading-tight">{tooltip.id}</p>
                            </div>
                            {tooltip.isRisk && (
                                <span className="px-2 py-0.5 bg-red-50 text-danger text-[10px] font-bold rounded-full border border-red-100">RISK</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Category</span>
                                <span className="font-medium text-gray-700">{tooltip.category}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Volume</span>
                                <span className="font-medium text-gray-900 font-mono">${(tooltip.volume || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Transactions</span>
                                <span className="font-medium text-gray-900 font-mono">{tooltip.transactions}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper to build hierarchy for D3 pack
function buildHierarchy(data) {
    if (!data || !data.clusters) return { name: 'root', children: [] };
    const { clusters } = data; // use directly since check above ensures data exists

    // Safety check for empty clusters
    const websites = clusters.websites || [];
    const mule_accounts = clusters.mule_accounts || [];
    const suspected_distribution = clusters.suspected_distribution || [];

    return {
        name: 'root',
        children: [
            {
                name: 'websites',
                category: 'website',
                // Map to children with category prop for easy access
                children: websites.map(w => ({ ...w, value: w.txCount || 1, category: 'website' }))
            },
            {
                name: 'mule_accounts',
                category: 'mule',
                children: mule_accounts.map(m => ({ ...m, value: m.txCount || 1, category: 'mule' }))
            },
            {
                name: 'suspected_distribution',
                category: 'suspected',
                children: suspected_distribution.map(s => ({ ...s, value: s.txCount || 1, category: 'suspected' }))
            }
        ]
    };
}
