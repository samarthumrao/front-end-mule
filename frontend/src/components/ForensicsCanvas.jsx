import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Plus, Minus, Scan, Filter, Layers, Download } from 'lucide-react';
import API_BASE from '../api';

export default function ForensicsCanvas({ suspectId }) {
    const svgRef = useRef(null);
    const containerRef = useRef(null);


    // Configuration for Node Styles (No hardcoded if/else chains in render)
    const GRAPH_CONFIG = {
        styles: {
            suspected: { fill: '#fee2e2', stroke: '#ef4444', r: 30 }, // Red
            related: { fill: '#dbeafe', stroke: '#3b82f6', r: 20 },   // Blue
            neutral: { fill: '#f1f5f9', stroke: '#94a3b8', r: 15 }    // Gray
        },
        simulation: {
            charge: -500,
            distance: 150
        }
    };

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || !suspectId) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        svg.attr('width', width).attr('height', height);

        // Grid Background
        const defs = svg.append('defs');
        const pattern = defs.append('pattern')
            .attr('id', 'grid')
            .attr('width', 40)
            .attr('height', 40)
            .attr('patternUnits', 'userSpaceOnUse');

        pattern.append('circle').attr('cx', 1).attr('cy', 1).attr('r', 1).attr('fill', '#e2e8f0');
        svg.append('rect').attr('width', '100%').attr('height', '100%').attr('fill', 'url(#grid)');

        // Arrow Marker
        defs.append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#94a3b8');

        // Fetch Data
        fetch(`${API_BASE}/investigation/network/${suspectId}`)
            .then(res => res.json())
            .then(data => {
                if (!data || !data.nodes || data.nodes.length === 0) {
                    // Show "No Data" message
                    svg.append('text')
                        .attr('x', width / 2)
                        .attr('y', height / 2)
                        .attr('text-anchor', 'middle')
                        .attr('fill', '#94a3b8')
                        .text('No network data found for this entity');
                    return;
                }

                const nodes = data.nodes.filter(n => n).map(d => ({
                    ...d,
                    ...GRAPH_CONFIG.styles[d.group || 'neutral']
                }));
                const links = data.links.map(d => ({ ...d }));

                // Simulation
                const simulation = d3.forceSimulation(nodes)
                    .force('link', d3.forceLink(links).id(d => d.id).distance(GRAPH_CONFIG.simulation.distance))
                    .force('charge', d3.forceManyBody().strength(GRAPH_CONFIG.simulation.charge))
                    .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05));

                // Links
                const link = svg.append('g')
                    .attr('stroke', '#cbd5e1')
                    .attr('stroke-width', 1.5)
                    .selectAll('line')
                    .data(links)
                    .join('line')
                    .attr('stroke-dasharray', d => d.dashed ? '4 4' : null)
                    .attr('marker-end', 'url(#arrow)');

                // Nodes
                const node = svg.append('g')
                    .selectAll('g')
                    .data(nodes)
                    .join('g')
                    .call(d3.drag()
                        .on('start', (e, d) => {
                            if (!e.active) simulation.alphaTarget(0.3).restart();
                            d.fx = d.x;
                            d.fy = d.y;
                        })
                        .on('drag', (e, d) => {
                            d.fx = e.x;
                            d.fy = e.y;
                        })
                        .on('end', (e, d) => {
                            if (!e.active) simulation.alphaTarget(0);
                            d.fx = null;
                            d.fy = null;
                        }));

                // Focus Ring
                node.filter(d => d.id === suspectId)
                    .append('circle')
                    .attr('r', 50)
                    .attr('fill', 'none')
                    .attr('stroke', '#ef4444')
                    .attr('stroke-width', 1.5)
                    .attr('stroke-dasharray', '4 4')
                    .attr('class', 'animate-spin-slow');

                // Node Circles (Style from Config)
                node.append('circle')
                    .attr('r', d => d.r)
                    .attr('fill', d => d.fill)
                    .attr('stroke', d => d.stroke)
                    .attr('stroke-width', 2);

                // Central Focus Dot
                node.filter(d => d.id === suspectId)
                    .append('circle').attr('r', 6).attr('fill', '#ef4444');

                // Labels
                node.append('text')
                    .text(d => d.id)
                    .attr('dy', d => d.r + 15)
                    .attr('text-anchor', 'middle')
                    .attr('class', 'text-[10px] font-mono font-medium fill-slate-500');

                // Tick
                simulation.on('tick', () => {
                    link
                        .attr('x1', d => d.source.x)
                        .attr('y1', d => d.source.y)
                        .attr('x2', d => d.target.x)
                        .attr('y2', d => d.target.y);

                    node.attr('transform', d => `translate(${d.x},${d.y})`);
                });
            })
            .catch(err => {
                console.error("Graph fetch error:", err);
                svg.append('text')
                    .attr('x', width / 2)
                    .attr('y', height / 2)
                    .attr('text-anchor', 'middle')
                    .attr('fill', '#ef4444')
                    .text('Error loading graph data');
            });

    }, [suspectId]);

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-start pointer-events-none">
                <div className="pointer-events-auto">
                    <h2 className="text-2xl font-bold text-gray-900">Forensics Canvas</h2>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <span>Investigating suspect</span>
                        <span className="font-bold text-primary font-mono bg-blue-50 px-1 rounded">{suspectId || 'Select a Suspect'}</span>
                        <span>and its</span>
                        <span className="font-bold text-primary cursor-pointer hover:underline">Local Network</span>
                    </div>
                </div>

                <div className="pointer-events-auto bg-white border border-gray-200 rounded-lg p-1 flex shadow-sm">
                    <button
                        onClick={() => window.location.href = `${API_BASE}/export/json`}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-primary flex items-center gap-2"
                        title="Export Full Analysis"
                    >
                        <Download className="w-3.5 h-3.5" />
                        JSON Download
                    </button>
                </div>
            </div>


            {/* Canvas */}
            <div ref={containerRef} className="flex-1 w-full h-full">
                <svg ref={svgRef} className="block w-full h-full" />
            </div>


        </div>
    );
}
