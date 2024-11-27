'use client'

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { SavedCodeBlock } from '@/lib/types'

interface SavedBlocksDrawerProps {
    isOpen: boolean
    onClose: () => void
    blocks: SavedCodeBlock[]
    onLoad: (block: SavedCodeBlock) => void
    onDelete: (block: SavedCodeBlock) => void
}

export function SavedBlocksDrawer({ isOpen, onClose, blocks, onLoad, onDelete }: SavedBlocksDrawerProps) {
    const handleLoad = (block: SavedCodeBlock) => {
        onLoad(block)
        onClose()
    }

    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-4xl min-h-[400px] max-h-[600px] overflow-y-auto">
                    <DrawerHeader>
                        <DrawerTitle>Saved Code Blocks</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Last Modified</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {blocks.map((block) => (
                                    <TableRow key={block.id}>
                                        <TableCell>{block.name}</TableCell>
                                        <TableCell>{new Date(block.lastModified).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleLoad(block)}>
                                                    Load
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => onDelete(block)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
