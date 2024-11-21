import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserNavProps {
  username: string
  orgDomain: string
  photoUrl?: string
}

export default function UserNav({ username, orgDomain }: UserNavProps) {
  const router = useRouter()

  const handleSignOut = () => {
    localStorage.removeItem('sf_refresh_token')
    localStorage.removeItem('sf_user_info')
    document.cookie = 'sf_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/auth')
  }

  console.log(username, orgDomain)

  return (
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
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}