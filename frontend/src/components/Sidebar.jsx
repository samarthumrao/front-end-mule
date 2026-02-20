import { Shield, LayoutDashboard, Database, Activity, FileText, Settings, Sliders, ToggleLeft, ToggleRight } from 'lucide-react';

export default function Sidebar({ activeModule = 'Dashboard', filters, onFilterChange }) {
    return (
        <div className="w-64 bg-white border-r border-border h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-40">
            {/* Brand */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                    <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-sm font-bold text-gray-900 leading-tight">RIFT 2026</h1>
                    <p className="text-[10px] text-gray-500 font-medium tracking-wide">Financial Forensics</p>
                </div>
            </div>

            {/* Modules */}
            <div className="px-4 py-2">
                <p className="px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Modules</p>

                {/* Navigation Links using window.location.hash or simpler prop-based switching if controlled by parent */}
                {/* Since we are using standard React state in App.jsx, we rely on the App to render specific pages. 
            However, for the Sidebar to trigger changes, it usually needs a callback or Link. 
            Given the constraints, I will make these clickable to cleaner prop-based navigation if needed, 
            but standard anchor tags or buttons that bubble up event would be best. 
            For now, let's assume the App.jsx passes a navigation function OR we use a simple hack if App.jsx handles state.
            Wait, I need to look at App.jsx again. It passes `onNavigate` to Navbar, but `Sidebar` is used locally in DashboardPage.
            I should lift state up or use a Context, but to keep it simple I will just use window events or expect a prop.
            Actually, the simplest way is to accept an `onNavigate` prop in Sidebar too.
        */}
                <SidebarLink icon={LayoutDashboard} label="Dashboard" active={activeModule === 'Dashboard'} id="dashboard" />
                <SidebarLink icon={Database} label="Investigation" active={activeModule === 'Investigation'} id="investigation" />
            </div>

            {/* Separator */}
            <div className="my-4 border-t border-gray-100 mx-6" />

            {/* Analysis Filters - Only show if Dashboard ?? 
          Actually investigation1.png shows the sidebar *persists* but the content changes. 
          If activeModule is Investigation, maybe we hide Dashboard filters?
          The image investigation1.png DOES NOT show the global sidebar on the left. 
          It shows "RIFT 2026" then "Pattern Filters" immediately below. 
          This implies the SIDEBAR ITSELF changes content.
          BUT, the user asked to "click investigation tab".
          To support both, I will CONDITIONALLY render the sidebar content based on activeModule.
      */}

            {activeModule === 'Dashboard' && filters && onFilterChange && (
                <div className="px-6 py-2 flex-1 animate-in fade-in duration-300">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Analysis Filters</p>
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-700">Fan-in / Fan-out Ratio</span>
                            <span className="px-1.5 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded border border-blue-100">
                                {filters.fanWindow === 0 ? 'All' : filters.fanWindow === 1 ? 'Medium' : 'High'}
                            </span>
                        </div>
                        <div className="relative w-full h-1.5 bg-gray-200 rounded-full mb-1">
                            {/* Track background */}
                            <div className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${filters.fanWindow * 50}%` }} />

                            {/* Interactive Sliders (Simplified as 3-step click areas) */}
                            <div className="absolute inset-0 flex items-center justify-between px-[1px]">
                                {[0, 1, 2].map(step => (
                                    <div
                                        key={step}
                                        onClick={() => onFilterChange({ ...filters, fanWindow: step })}
                                        className={`w-3 h-3 rounded-full border-2 cursor-pointer transition-all ${filters.fanWindow >= step ? 'bg-white border-primary scale-110' : 'bg-gray-300 border-transparent'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => onFilterChange({ ...filters, commissionRetention: !filters.commissionRetention })}>
                            <span className="text-xs font-medium text-gray-700">Commission Retention</span>
                            {filters.commissionRetention ? (
                                <ToggleRight className="w-9 h-9 text-primary cursor-pointer transition-colors" />
                            ) : (
                                <ToggleLeft className="w-9 h-9 text-gray-300 cursor-pointer transition-colors" />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings */}
            <div className="p-4 border-t border-border mt-auto">
                <SidebarLink icon={Settings} label="Settings" />
            </div>
        </div>
    );
}

function SidebarLink({ icon: Icon, label, active, id }) {
    // Simple dispatch to parent app
    const handleClick = () => {
        // Dispatch a custom event for simplicity if direct prop passing is complex across pages
        window.dispatchEvent(new CustomEvent('navigate', { detail: id }));
    };

    return (
        <button
            onClick={handleClick}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${active
                ? 'bg-blue-50 text-primary'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
        >
            <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-gray-400'}`} />
            {label}
        </button>
    );
}
