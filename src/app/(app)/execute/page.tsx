'use client'

import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CodeEditor } from '@/components/CodeEditor'
import { SaveCodeBlockModal } from '@/components/SaveCodeBlockModal'
import { refreshAccessToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Save, X, Loader2 } from 'lucide-react'
import { SavedBlocksDrawer } from '@/components/SavedBlocksDrawer'
import { SavedCodeBlock } from '@/lib/types'
import { storage } from '@/lib/storage'

function ExecuteContent() {
    const [code, setCode] = useState('')
    const [isExecuting, setIsExecuting] = useState(false)
    const [isSaveModalOpen, setSaveModalOpen] = useState(false)
    const [savedBlocks, setSavedBlocks] = useState<SavedCodeBlock[]>([])
    const [activeBlock, setActiveBlock] = useState<SavedCodeBlock | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const router = useRouter()

    // Load saved blocks on mount
    useEffect(() => {
        const currentDomain = storage.getCurrentDomain()
        if (!currentDomain) {
            console.error('No current domain found')
            return
        }

        const savedCodeBlocks = storage.getFromDomain(currentDomain, 'saved_code_blocks')
        if (savedCodeBlocks) {
            setSavedBlocks(savedCodeBlocks)
        }
    }, [])

    const saveBlocks = (blocks: SavedCodeBlock[]) => {
        const currentDomain = storage.getCurrentDomain()
        if (!currentDomain) {
            console.error('No current domain found')
            return
        }

        storage.setForDomain(currentDomain, 'saved_code_blocks', blocks)
        setSavedBlocks(blocks)
    }

    const handleSave = (name: string) => {
        const newBlock: SavedCodeBlock = {
            id: crypto.randomUUID(),
            name,
            code,
            lastModified: new Date().toISOString()
        }

        const updated = [...savedBlocks, newBlock]
        saveBlocks(updated)
        setActiveBlock(newBlock)
        toast.success('Code block saved')
    }

    const handleUpdateActive = () => {
        if (!activeBlock) return

        const updated = savedBlocks.map((block) =>
            block.id === activeBlock.id ? { ...block, code, lastModified: new Date().toISOString() } : block,
        )

        saveBlocks(updated)
        setActiveBlock({
            ...activeBlock,
            code,
            lastModified: new Date().toISOString(),
        })
        toast.success('Code block updated')
    }

    const handleLoad = (block: SavedCodeBlock) => {
        setCode(block.code)
        setActiveBlock(block)
    }

    const handleDelete = (block: SavedCodeBlock) => {
        if (!confirm(`Are you sure you want to delete "${block.name}"?`)) return

        const updated = savedBlocks.filter((b) => b.id !== block.id)
        saveBlocks(updated)

        if (activeBlock?.id === block.id) {
            handleClose()
        }

        toast.success('Code block deleted')
    }

    const handleClose = () => {
        setActiveBlock(null)
        setCode('')
    }

    const executeCode = async (codeToExecute: string) => {
        const currentDomain = storage.getCurrentDomain()
        if (!currentDomain) {
            toast.error('No current domain found')
            return
        }

        const refreshToken = storage.getFromDomain(currentDomain, 'refresh_token')
        if (!refreshToken) {
            toast.error('Not authenticated')
            return
        }

        try {
            setIsExecuting(true)
            const { access_token, instance_url } = await refreshAccessToken(refreshToken)

            const response = await fetch(`/api/salesforce/execute?instance_url=${encodeURIComponent(instance_url)}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: codeToExecute }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to execute code')
            }

            // Store the log ID for automatic selection
            if (result.logId) {
                storage.setForDomain(currentDomain, 'pending_log_selection', result.logId)

                // Check the execution status
                if (result.logStatus === 'Success') {
                    toast.success('Code executed successfully', {
                        action: {
                            label: 'View Log',
                            onClick: () => router.push('/logs'),
                        },
                    })
                } else {
                    toast.error(result.logStatus || 'Execution failed', {
                        action: {
                            label: 'View Log',
                            onClick: () => router.push('/logs'),
                        },
                    })
                }
            } else {
                toast.error(result.exceptionMessage || result.compileProblem || 'Failed to execute code')
            }
        } catch (error: any) {
            console.error('Execute error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to execute code')
        } finally {
            setIsExecuting(false)
        }
    }

    const handleExecute = () => {
        executeCode(code)
    }

    const handleExecuteHighlighted = () => {
        // CodeMirror will provide the selected text through our CodeEditor component
        const selection = window.getSelection()?.toString()
        if (!selection) {
            toast.error('No code selected')
            return
        }
        executeCode(selection)
    }

    return (
        <div className="p-4 h-full flex flex-col">
            {/* Active Block Header */}
            {activeBlock && (
                <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{activeBlock.name}</span>
                    <Button variant="ghost" size="sm" onClick={handleUpdateActive}>
                        <Save className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Code Editor */}
            <div className="flex-1 min-h-[200px] mb-4">
                <CodeEditor value={code} onChange={setCode} language="apex" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button onClick={handleExecute} disabled={isExecuting}>
                    Execute
                </Button>
                <Button onClick={handleExecuteHighlighted} disabled={isExecuting} variant="outline">
                    Execute Highlighted
                </Button>
                {!activeBlock && (
                    <Button onClick={() => setSaveModalOpen(true)} variant="outline">
                        Add to Saved Blocks
                    </Button>
                )}
                <Button onClick={() => setIsDrawerOpen(true)} variant="outline">
                    View Saved
                </Button>
            </div>

            <SaveCodeBlockModal
                isOpen={isSaveModalOpen}
                onClose={() => setSaveModalOpen(false)}
                onSave={handleSave}
            />

            <SavedBlocksDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                blocks={savedBlocks}
                onLoad={handleLoad}
                onDelete={handleDelete}
            />
        </div>
    )
}

export default function ExecutePage() {
    return (
        <Suspense fallback={
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
        }>
            <ExecuteContent />
        </Suspense>
    )
}
