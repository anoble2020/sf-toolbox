import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, LogOut, User, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { OrgSwitcherModal } from '@/components/OrgSwitcherModal'
import { introspectToken } from '@/lib/auth'

interface UserNavProps {
    username: string
    orgDomain: string
    orgId: string
    photoUrl?: string
}

export default function UserNav({ username, orgDomain, orgId }: UserNavProps) {
    const router = useRouter()
    const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false)
    const [tokenExpiration, setTokenExpiration] = useState<number | null>(null);
    const [authMethod, setAuthMethod] = useState<'session' | 'refresh' | null>(null);

    useEffect(() => {
        const checkToken = async () => {
            const sessionToken = localStorage.getItem('sf_session_token');
            const sessionDomain = localStorage.getItem('sf_session_domain');
            
            if (sessionToken && sessionDomain?.includes(orgDomain)) {
                //const info = await introspectToken(sessionToken);
                //setTokenExpiration(info.remaining_minutes);
                setAuthMethod('session');
            } else if (localStorage.getItem('sf_refresh_token')) {
                setAuthMethod('refresh');
            }
        };
        
        checkToken();
        const interval = setInterval(checkToken, 60000);
        return () => clearInterval(interval);
    }, [orgDomain]);

    const handleSwitchUser = () => {
        setIsOrgSwitcherOpen(true)
    }

    const handleSignOut = () => {
        localStorage.removeItem('sf_refresh_token')
        localStorage.removeItem('sf_user_info')
        document.cookie = 'sf_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        router.push('/auth')
    }

    console.log(username, orgDomain)

    return (
        <>
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-light">{username}</span>
                    <span className="text-xs text-muted-foreground">{orgDomain}</span>
                    {authMethod === 'session' && tokenExpiration !== null && (
                        <span className="text-xs text-muted-foreground">
                            Session expires in {tokenExpiration}m
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                        Using {authMethod} auth
                    </span>
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
