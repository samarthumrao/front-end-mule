import { Users, Share2, FileText, Download } from 'lucide-react';

export default function NodeDetailsPanel({ suspectId }) {
    const peers = [
        { id: '0x1299C4', risk: 'High' },
        { id: '0xBB24F1', risk: 'Med' },
        { id: '0x88BC12', risk: 'Low' },
    ];

    return (
        <div className="bg-white border-l border-border h-full flex flex-col w-full overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-border bg-gray-50/30">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 shadow-sm">
                        <Users className="w-6 h-6 text-danger" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-none mb-1">
                            Focus: <span className="text-base font-mono block mt-1">{suspectId || 'None'}</span>
                        </h2>
                        {suspectId && (
                            <p className="text-xs text-gray-500 mt-2">
                                Select nodes in the graph to verify connections.
                                Use the JSON export to view full analysis details.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {!suspectId && (
                <div className="p-8 text-center text-gray-400">
                    <p className="text-sm">Select a suspect from the list to view details.</p>
                </div>
            )}
        </div>
    );
}
