"use client";

import { Scroll, Flag, FlaskConical, Search, Play, Github, Coffee } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import UserNav from '@/components/UserNav';
import { ApiLimits } from '@/components/ApiLimits';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Logs', path: '/logs', icon: Scroll },
    { name: 'Trace Flags', path: '/trace-flags', icon: Flag },
    { name: 'Tests', path: '/tests', icon: FlaskConical },
    { name: 'Query', path: '/query', icon: Search },
    { name: 'Execute', path: '/execute', icon: Play },
  ];

  return (
    <div className="h-screen flex">
      {/* Fixed sidebar */}
      <aside className="w-64 fixed inset-y-0 left-0 flex flex-col bg-white border-r border-gray-200">
        {/* Logo section */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <img src="/icon_128_purp.png" alt="apex toolbox" className="w-8 h-8 mr-2" />
          <span className="text-xl font-semibold">apex toolbox</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-3">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center px-3 py-2 rounded-md mb-1 text-sm font-medium",
                pathname === item.path
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Disclaimer and links */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <p className="text-[11px] text-gray-500 mb-4 leading-tight">
            These tools are not created, supported or endorsed by Salesforce.com. Use at your own risk and discretion.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="https://github.com/anoble2020/apex-toolkit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
            >
              <Github className="w-4 h-4" />
              <span className="text-xs">View project on GitHub</span>
            </a>
            <a
              href="https://buymeacoffee.com/alexandernoble"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
            >
              <Coffee className="w-4 h-4" />
              <span className="text-xs">Buy me a coffee</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-full px-6">
            <ApiLimits />
            <UserNav 
              username={localStorage.getItem('sf_user_info') ? JSON.parse(localStorage.getItem('sf_user_info')!).username : ''}
              orgDomain={localStorage.getItem('sf_user_info') ? JSON.parse(localStorage.getItem('sf_user_info')!).instance_url : ''}
            />
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 