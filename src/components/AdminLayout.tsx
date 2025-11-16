import React from 'react';
import AdminNav from './AdminNav';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <AdminNav />
            {/* Main content con padding per sidebar su desktop */}
            <main className="py-8 lg:pl-64">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
