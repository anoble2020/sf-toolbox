'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface SelectTestMethodsModalProps {
    isOpen: boolean
    onClose: () => void
    testClass: {
        Name: string
        testMethods: string[]
    }
    onRunTests: (methodNames: string[]) => void
}

export function SelectTestMethodsModal({ isOpen, onClose, testClass, onRunTests }: SelectTestMethodsModalProps) {
    const [selectedMethods, setSelectedMethods] = useState<string[]>([])

    const handleSelectAll = () => {
        if (selectedMethods.length === testClass.testMethods.length) {
            setSelectedMethods([])
        } else {
            setSelectedMethods([...testClass.testMethods])
        }
    }

    const handleSubmit = () => {
        onRunTests(selectedMethods)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Test Methods - {testClass.Name}</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <Checkbox
                            id="select-all"
                            checked={selectedMethods.length === testClass.testMethods.length}
                            onCheckedChange={handleSelectAll}
                        />
                        <Label htmlFor="select-all">Select All Methods</Label>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {testClass.testMethods.map((method) => (
                            <div key={method} className="flex items-center space-x-2">
                                <Checkbox
                                    id={method}
                                    checked={selectedMethods.includes(method)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedMethods([...selectedMethods, method])
                                        } else {
                                            setSelectedMethods(selectedMethods.filter((m) => m !== method))
                                        }
                                    }}
                                />
                                <Label htmlFor={method}>{method}</Label>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={selectedMethods.length === 0}>
                        Run Selected Tests
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
