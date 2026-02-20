import { useEffect, useState } from 'react';
import API_BASE from '../api';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import CirclePackNetwork from '../components/CirclePackNetwork';
import RiskScoreDistribution from '../components/RiskScoreDistribution';
import ActivePatternCard from '../components/ActivePatternCard';
import DetectedRingsTable from '../components/DetectedRingsTable';
import axios from 'axios';

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCluster, setSelectedCluster] = useState('all');
    const [filters, setFilters] = useState({ fanWindow: 2, commissionRetention: false });

    useEffect(() => {
        // Fetch latest data on mount
        axios.get(`${API_BASE}/data`)
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // Filter logic for lower widgets
    const getFilteredData = () => {
        if (!data || !data.clusters) return [];

        let initialList = [];
        if (selectedCluster === 'all') {
            initialList = [
                ...(data.clusters.mule_accounts || []),
                ...(data.clusters.suspected_distribution || []),
                ...(data.clusters.websites || [])
            ];
        } else {
            initialList = data.clusters[selectedCluster] || [];
        }

        // Apply Analysis Filters
        return initialList.filter(node => {
            // Commission Retention Filter
            if (filters.commissionRetention && !node.is_commission) return false;

            // Fan-in / Fan-out Ratio Filter
            // Thresholds: 0 (All) -> >0, 1 (Medium) -> >2, 2 (High) -> >5
            const threshold = filters.fanWindow === 0 ? 0 : filters.fanWindow === 1 ? 2.0 : 5.0;
            if (node.fan_in_out_ratio < threshold) return false;

            return true;
        });
    };

    const widgetData = getFilteredData();

    return (
        <div className="flex min-h-screen bg-surface font-sans">
            {/* 1. Sidebar */}
            <Sidebar
                activeModule="Dashboard"
                filters={filters}
                onFilterChange={setFilters}
            />

            {/* Main Content Wrapper */}
            <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">

                {/* 2. Header */}
                <DashboardHeader />

                {/* 3. Dashboard Grid Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6 h-full">

                        {/* Left Column: Circle Pack + Rings Table (8 cols) */}
                        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

                            {/* Circle Pack Chart */}
                            <div className="flex-[3] min-h-[500px]">
                                <CirclePackNetwork
                                    data={data}
                                    selectedCluster={selectedCluster}
                                    onSelectCluster={setSelectedCluster}
                                />
                            </div>

                            {/* Detected Rings Table */}
                            <div className="flex-[2]">
                                <DetectedRingsTable
                                    rings={data?.rings || []}
                                    filterType={selectedCluster}
                                />
                            </div>

                        </div>

                        {/* Right Column: Risk Score + Active Pattern (4 cols) */}
                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

                            {/* Risk Distribution */}
                            <div className="h-[320px]">
                                <RiskScoreDistribution data={widgetData} />
                            </div>

                            {/* Active Pattern Card */}
                            <div className="flex-1">
                                <ActivePatternCard data={widgetData} filterType={selectedCluster} />
                            </div>

                        </div>

                    </div>
                </main>

            </div>
        </div>
    );
}
