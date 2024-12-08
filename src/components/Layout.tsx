'use client'

import { Scroll, Flag, FlaskConical, Search, Play, Github, Coffee, Telescope, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import UserNav from '@/components/UserNav'
import { ApiLimits } from '@/components/ApiLimits'
import { useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { storage } from '@/lib/storage'

interface LayoutProps {
    children: React.ReactNode
}

interface UserInfo {
    username: string
    orgDomain: string
    orgId: string
}

export default function Layout({ children }: LayoutProps) {
    const pathname = usePathname()
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

    useEffect(() => {
        const currentDomain = storage.getCurrentDomain()
        if (currentDomain) {
            try {
                const domainUserInfo = storage.getFromDomain(currentDomain, 'user_info')
                if (domainUserInfo) {
                    setUserInfo({
                        username: domainUserInfo.username,
                        orgDomain: domainUserInfo.orgDomain,
                        orgId: domainUserInfo.orgId
                    })
                }
            } catch (e: unknown) {
                console.error('Failed to get user info:', e)
            }
        }
    }, [])

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Logs', path: '/logs', icon: Scroll },
        { name: 'Trace Flags', path: '/trace-flags', icon: Flag },
        { name: 'Query', path: '/query', icon: Search },
        { name: 'Execute', path: '/execute', icon: Play },
        { name: 'Tests', path: '/tests', icon: FlaskConical },
        { name: 'Explore', path: '/explore', icon: Telescope },
    ]

    return (
        <div className="h-screen flex">
            {/* Fixed sidebar */}
            <aside className="w-64 fixed inset-y-0 left-0 flex flex-col bg-background border-r border-border z-50">
                {/* Logo section */}
                <div className="h-16 flex flex-col justify-center px-6 border-b border-border">
                    <div className="flex items-center mt-2">
                        <img src="/icon_128_purp.png" alt="apex toolbox" className="w-8 h-8 mb-6 mr-2" />
                        <span className="text-xl font-semibold">
                            sf toolbox
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 -mt-1 ml-10 ">v0.0.1</div>
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 pt-6 px-3 bg-sidebar-background">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={cn(
                                'flex items-center px-3 py-1.5 rounded-md mb-1 text-sm font-weight-[400]',
                                pathname === item.path
                                    ? 'bg-[#e1e1e1] text-gray-900 dark:bg-gray-600 dark:text-gray-100'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-100',
                            )}
                        >
                            <item.icon className="w-3 h-3 mr-3" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Disclaimer and links */}
                <div className="mt-auto p-4 border-t border-border">
                    <p className="text-[11px] text-gray-500 dark:text-gray-500 mb-4 leading-tight">
                        These tools are not created, supported or endorsed by Salesforce.com. Use at your own risk and
                        discretion.
                    </p>
                    <div className="flex flex-col gap-2">
                        <a
                            href="https://github.com/anoble2020/apex-toolkit"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 text-sm"
                        >
                            <Github className="w-4 h-4" />
                            <span className="text-xs">View project on GitHub</span>
                        </a>
                        <a
                            href="https://buymeacoffee.com/alexandernoble"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 text-sm"
                        >
                            <Coffee className="w-4 h-4" />
                            <span className="text-xs">Buy me a coffee</span>
                        </a>
                    </div>
                </div>
            </aside>

            {/* Main content wrapper */}
            <div className="ml-64 flex-1 flex flex-col min-w-0">
                {/* Fixed header */}
                <header className="h-16 fixed top-0 right-0 left-64 border-b border-border px-4 flex items-center justify-between bg-background">
                    <div className="flex-none">
                        <ApiLimits />
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <UserNav
                            username={userInfo?.username || ''}
                            orgDomain={userInfo?.orgDomain || ''}
                            orgId={userInfo?.orgId || ''}
                        />
                    </div>
                </header>

                {/* Scrollable content area */}
                <main className="mt-16 flex-1 overflow-auto">{children}</main>
            </div>
        </div>
    )
}