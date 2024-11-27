import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type { ConnectedOrg } from '@/lib/types'
import { Plus, LogOut, CheckCircle2 } from 'lucide-react'

interface OrgSwitcherModalProps {
    isOpen: boolean
    onClose: () => void
    currentOrgId: string
}

export function OrgSwitcherModal({ isOpen, onClose, currentOrgId }: OrgSwitcherModalProps) {
    const [orgs, setOrgs] = useState<ConnectedOrg[]>([])
    const router = useRouter()

    useEffect(() => {
        const storedOrgs = localStorage.getItem('connected_orgs')
        if (storedOrgs) {
            setOrgs(JSON.parse(storedOrgs))
        }
    }, [isOpen])

    const handleSwitch = (org: ConnectedOrg) => {
        // Clear all cached data except code blocks
        Object.keys(localStorage).forEach(key => {
            if (!key.startsWith('saved_code_blocks_') && key !== 'connected_orgs') {
                localStorage.removeItem(key)
            }
        })

        // Set the new refresh token and user info
        localStorage.setItem('sf_refresh_token', org.refreshToken)
        localStorage.setItem('sf_user_info', JSON.stringify({
            orgId: org.orgId,
            orgDomain: org.orgDomain,
            username: org.username
        }))

        // Update last accessed
        const updatedOrgs = orgs.map(o => ({
            ...o,
            lastAccessed: o.orgId === org.orgId ? new Date().toISOString() : o.lastAccessed
        }))
        localStorage.setItem('connected_orgs', JSON.stringify(updatedOrgs))

        onClose()
        router.refresh()
    }

    const handleAddNew = () => {
        localStorage.removeItem('sf_refresh_token')
        localStorage.removeItem('sf_user_info')
        router.push('/auth')
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="md:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Switch Organization</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    {orgs.map((org) => (
                        <div
                            key={org.orgId}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                        >
                            <div>
                                <div className="font-medium">{org.username}</div>
                                <div className="text-sm text-gray-500">{org.orgDomain}</div>
                            </div>
                            {org.orgId === currentOrgId ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                                <Button variant="ghost" size="sm" onClick={() => handleSwitch(org)}>
                                    Switch
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button onClick={handleAddNew} variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Connect New Org
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
} 