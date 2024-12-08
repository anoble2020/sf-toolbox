import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ConnectedOrg } from '@/lib/types'
import { storage } from '@/lib/storage'

interface OrgSwitcherModalProps {
    isOpen: boolean
    onClose: () => void
    currentOrgId: string
}

export function OrgSwitcherModal({ isOpen, onClose, currentOrgId }: OrgSwitcherModalProps) {
    const [orgs, setOrgs] = useState<ConnectedOrg[]>([])
    const router = useRouter()

    useEffect(() => {
        const currentDomain = storage.getCurrentDomain()
        if (currentDomain) {
            const connectedOrgs = storage.getFromDomain(currentDomain, 'connected_orgs') || []
            setOrgs(connectedOrgs)
        }
    }, [isOpen])

    const handleSwitch = (org: ConnectedOrg) => {
        // Set new domain as current
        storage.setCurrentDomain(org.orgDomain)
        
        // Store refresh token and user info for new domain
        storage.setForDomain(org.orgDomain, 'refresh_token', org.refreshToken)
        storage.setForDomain(org.orgDomain, 'user_info', {
            orgId: org.orgId,
            orgDomain: org.orgDomain,
            username: org.username
        })

        // Update last accessed
        const updatedOrgs = orgs.map(o => ({
            ...o,
            lastAccessed: o.orgId === org.orgId ? new Date().toISOString() : o.lastAccessed
        }))
        storage.setForDomain(org.orgDomain, 'connected_orgs', updatedOrgs)

        onClose()
        router.refresh()
    }

    const handleAddNew = () => {
        const currentDomain = storage.getCurrentDomain()
        if (currentDomain) {
            storage.clearDomain(currentDomain)
        }
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
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
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