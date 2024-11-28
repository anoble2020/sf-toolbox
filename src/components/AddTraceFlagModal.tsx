'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { SalesforceUser, DebugLevel } from '@/lib/salesforce'

interface AddTraceFlagModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (userId: string, debugLevelId: string) => Promise<void>
    users: SalesforceUser[]
    debugLevels: DebugLevel[]
}

export function AddTraceFlagModal({ isOpen, onClose, onSubmit, users, debugLevels }: AddTraceFlagModalProps) {
    const [selectedUser, setSelectedUser] = useState('')
    const [selectedDebugLevel, setSelectedDebugLevel] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!selectedUser || !selectedDebugLevel) return

        try {
            setIsSubmitting(true)
            await onSubmit(selectedUser, selectedDebugLevel)
            onClose()
        } catch (error: unknown) {
            console.error('Failed to create trace flag:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Trace Flag</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="user">User</Label>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((user) => (
                                    <SelectItem key={user.Id} value={user.Id}>
                                        <span className="font-bold mr-2">{user.Name}</span>
                                        <span className="text-muted-foreground">{user.Username}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="debugLevel">Log Level</Label>
                        <Select value={selectedDebugLevel} onValueChange={setSelectedDebugLevel}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a log level" />
                            </SelectTrigger>
                            <SelectContent>
                                {debugLevels.map((level) => (
                                    <SelectItem key={level.Id} value={level.Id}>
                                        {level.MasterLabel}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!selectedUser || !selectedDebugLevel || isSubmitting}>
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
