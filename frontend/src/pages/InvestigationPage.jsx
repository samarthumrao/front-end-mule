import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import InvestigationListPanel from '../components/InvestigationListPanel';
import ForensicsCanvas from '../components/ForensicsCanvas';
import NodeDetailsPanel from '../components/NodeDetailsPanel';

export default function InvestigationPage() {
    const [selectedSuspect, setSelectedSuspect] = useState(null); // Auto-selected by list

    return (
        <div className="flex h-screen bg-surface font-sans overflow-hidden">
            {/* Global Sidebar (Persisted) */}
            <Sidebar activeModule="Investigation" />

            {/* Investigation Content (Full Screen Replacement of Dashboard Grid) */}
            <div className="flex-1 ml-64 flex h-full">
                {/* Left Panel: 300px Fixed */}
                <div className="w-[300px] flex-shrink-0 h-full">
                    <InvestigationListPanel
                        selectedId={selectedSuspect}
                        onSelect={setSelectedSuspect}
                    />
                </div>

                {/* Center Canvas: Flexible */}
                <div className="flex-1 h-full relative">
                    <ForensicsCanvas suspectId={selectedSuspect} />
                </div>

                {/* Right Panel: 320px Fixed */}
                <div className="w-[320px] flex-shrink-0 h-full">
                    <NodeDetailsPanel suspectId={selectedSuspect} />
                </div>
            </div>
        </div>
    );
}
