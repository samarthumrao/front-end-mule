import { Shield, Bell, User } from 'lucide-react';

const navLinks = ['Dashboard', 'Ingestion', 'Forensics', 'Reports', 'Settings'];

export default function Navbar({ activeLink, onNavigate }) {
    return (
        <nav className="bg-white border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-50">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                    <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-lg font-bold text-gray-900 tracking-tight">Mule Detect</span>
            </div>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
                {navLinks.map((link) => (
                    <button
                        key={link}
                        onClick={() => {
                            if (link === 'Dashboard' && onNavigate) onNavigate('dashboard');
                            if (link === 'Ingestion' && onNavigate) onNavigate('ingestion');
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${link === activeLink
                                ? 'text-gray-900 border-b-2 border-primary'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {link}
                    </button>
                ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
                <button className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <Bell className="w-[18px] h-[18px] text-gray-500" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center ring-2 ring-gray-100">
                    <User className="w-4 h-4 text-white" />
                </div>
            </div>
        </nav>
    );
}
