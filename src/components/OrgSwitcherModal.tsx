import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Plus, Cloud, Code } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ConnectedOrg } from '@/lib/types'
import { storage } from '@/lib/storage'
import { toast } from 'sonner'

interface OrgSwitcherModalProps {
    isOpen: boolean
    onClose: () => void
    currentOrgId: string
}

export function OrgSwitcherModal({ isOpen, onClose, currentOrgId }: OrgSwitcherModalProps) {
    const [orgs, setOrgs] = useState<ConnectedOrg[]>([])
    const router = useRouter()

    useEffect(() => {
        if (isOpen) {
            const connectedOrgs = storage.getAllConnectedOrgs() as ConnectedOrg[]
            console.log('Connected orgs:', connectedOrgs)
            setOrgs(connectedOrgs)
        }
    }, [isOpen])

    const handleSwitch = async (org: ConnectedOrg) => {
        try {
            console.log('Switching to org:', org)
            
            // Set new domain as current
            storage.setCurrentDomain(org.orgDomain)
            
            // Update the cookie with the new refresh token
            document.cookie = `sf_refresh_token=${org.refreshToken}; path=/; max-age=31536000`
            
            // Update last accessed and store updated org
            const updatedOrg = {
                ...org,
                lastAccessed: new Date().toISOString()
            }
            storage.addConnectedOrg(updatedOrg)
            
            onClose()
            window.location.href = '/dashboard'
        } catch (error) {
            console.error('Error switching organization:', error)
            toast.error('Failed to switch organization')
        }
    }

    const handleAddNewOrg = (environment: 'sandbox' | 'production') => {
        try {
            // Store current connected orgs
            const currentDomain = storage.getCurrentDomain()
            if (currentDomain) {
                const connectedOrgs = storage.getAllConnectedOrgs()
                localStorage.setItem('temp_connected_orgs', JSON.stringify(connectedOrgs))
            }

            // Add custom domain support
            const params = new URLSearchParams({
                connect: 'true',
                environment: environment
            })

            // Redirect to auth
            window.location.href = `/auth?${params.toString()}`
            onClose()
        } catch (error) {
            console.error('Error adding new org:', error)
            toast.error('Failed to initiate org connection')
        }
    }

    // Add debug output
    console.log('Current orgs state:', orgs)
    console.log('Current orgId:', currentOrgId)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="md:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Switch Organization</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    {orgs.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                            No organizations connected
                        </div>
                    ) : (
                        orgs.map((org) => (
                            <div
                                key={org.orgId}
                                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <div>
                                    <div className="font-medium">{org.username}</div>
                                    <div className="text-sm text-gray-500">{org.orgDomain}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {org.environmentType === 'sandbox' ? 'Sandbox' : 'Production'}
                                    </div>
                                </div>
                                {org.orgId === currentOrgId ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <Button variant="ghost" size="sm" onClick={() => handleSwitch(org)}>
                                        Switch
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => handleAddNewOrg('sandbox')} 
                            variant="outline" 
                            className="flex-1"
                        >
                            <Code className="h-4 w-4 mr-2" />
                            Connect Sandbox
                        </Button>
                        <Button 
                            onClick={() => handleAddNewOrg('production')} 
                            variant="outline" 
                            className="flex-1"
                        >
                            <Cloud className="h-4 w-4 mr-2" />
                            Connect Production
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
} 