import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    Users,
    Building,
    AlertCircle,
    CheckCircle,
    BarChart,
    MessageCircle,
    LogOut,
    Menu,
    X,
    Settings,
    Download
} from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from './ui/sheet';

const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Utenti' },
    { path: '/houses', icon: Building, label: 'Case' },
    { path: '/chats', icon: MessageCircle, label: 'Chat' },
    { path: '/reports', icon: AlertCircle, label: 'Segnalazioni' },
    { path: '/verifications', icon: CheckCircle, label: 'Verifiche' },
    { path: '/analytics', icon: BarChart, label: 'Analytics' },
    { path: '/export', icon: Download, label: 'Export Dati' },
    { path: '/setup', icon: Settings, label: 'Setup Admin' }
];

export default function AdminNav() {
    const location = useLocation();
    const { logout, user } = useAdmin();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Topbar minimale - solo logo, email e logout */}
            <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
                <div className="h-16 px-4 flex items-center justify-between lg:pl-64">
                    {/* Logo (visibile solo su mobile) */}
                    <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
                        <span className="text-2xl">🛡️</span>
                        <span className="font-bold text-xl text-blue-600">Mate Admin</span>
                    </Link>

                    {/* Desktop User Info & Logout */}
                    <div className="hidden lg:flex items-center gap-3 ml-auto">
                        <div className="text-sm text-gray-600">
                            {user?.email}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center gap-3">
                        <div className="text-xs text-gray-600 max-w-[100px] truncate">
                            {user?.email}
                        </div>

                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    <Menu className="w-6 h-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px]">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2 text-left">
                                        <span className="text-2xl">🛡️</span>
                                        <span className="font-bold text-xl text-blue-600">Mate Admin</span>
                                    </SheetTitle>
                                </SheetHeader>

                                <div className="mt-8 space-y-4">
                                    {/* User Info */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="text-sm font-medium text-gray-900">Logged in as:</div>
                                        <div className="text-sm text-gray-600 truncate">{user?.email}</div>
                                    </div>

                                    {/* Navigation Items */}
                                    <div className="space-y-2">
                                        {navItems.map(item => (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors w-full
                                  ${location.pathname === item.path
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                <item.icon className="w-5 h-5" />
                                                <span>{item.label}</span>
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-gray-200">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                logout();
                                                setMobileMenuOpen(false);
                                            }}
                                            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Logout
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </nav>

            {/* Sidebar laterale (solo desktop) */}
            <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-sm z-40">
                <div className="flex flex-col h-full">
                    {/* Logo nella sidebar */}
                    <Link to="/dashboard" className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
                        <span className="text-2xl">🛡️</span>
                        <span className="font-bold text-xl text-blue-600">Mate Admin</span>
                    </Link>

                    {/* Menu Items */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors
                  ${location.pathname === item.path
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>
            </aside>
        </>
    );
}
