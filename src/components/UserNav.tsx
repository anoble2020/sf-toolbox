import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'
import { Settings, LogOut, User, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { OrgSwitcherModal } from '@/components/OrgSwitcherModal'
import { storage } from '@/lib/storage'

interface UserNavProps {
    username: string
    orgDomain: string
    orgId: string
    photoUrl?: string
}

export default function UserNav({ username, orgDomain, orgId }: UserNavProps) {
    const router = useRouter()
    const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false)

    const handleSwitchUser = () => {
        setIsOrgSwitcherOpen(true)
    }

    const handleSignOut = () => {
        const currentDomain = storage.getCurrentDomain()
        if (currentDomain) {
            storage.clearDomain(currentDomain)
        }
        document.cookie = 'sf_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        router.push('/auth')
    }

    return (
        <>
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-light">{username}</span>
                    <span className="text-xs text-muted-foreground">{orgDomain}</span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="h-8 w-8 cursor-pointer">
                            <AvatarFallback>
                                <User className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSwitchUser}>
                            <Users className="mr-2 h-4 w-4" />
                            Switch User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSignOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log Out
                            <DropdownMenuShortcut>⌘Q</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <OrgSwitcherModal 
                isOpen={isOrgSwitcherOpen} 
                onClose={() => setIsOrgSwitcherOpen(false)}
                currentOrgId={orgId}
            />
        </>
    )
}
