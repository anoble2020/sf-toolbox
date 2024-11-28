'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CodeViewer } from '@/components/CodeViewer'
import { FileSelectionModal } from '@/components/FileSelectionModal'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import { refreshAccessToken } from '@/lib/auth'
import { BundleViewer } from '@/components/BundleViewer'
import { CACHE_DURATIONS } from '@/lib/constants'
interface FileMetadata {
    Id: string
    Name: string
    Body: string
    Coverage?: {
        coveredLines: number[]
        uncoveredLines: number[]
    }
    files?: {
        name: string
        content: string
        type: string
    }[]
}

interface FileData {
    apexClasses: FileItem[]
    triggers: FileItem[]
    lwc: FileItem[]
    aura: FileItem[]
    lastFetched: number
}

const fetchFiles = async () => {
    const refreshToken = localStorage.getItem('sf_refresh_token')
    if (!refreshToken) {
        throw new Error('No refresh token found')
    }

    const { access_token, instance_url } = await refreshAccessToken(refreshToken)

    const response = await fetch(`/api/salesforce/files?instance_url=${encodeURIComponent(instance_url)}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    })

    if (!response.ok) {
        throw new Error('Failed to fetch files')
    }

    const data = await response.json()
    return {
        ...data,
        lastFetched: Date.now(),
    }
}

export default function ExplorePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isFileModalOpen, setIsFileModalOpen] = useState(false)
    const [file, setFile] = useState<FileMetadata | null>(null)
    const [files, setFiles] = useState<FileData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fileId = searchParams.get('id')
    const fileType = searchParams.get('type')
    const coverageParam = searchParams.get('coverage')

    // Combine the file fetching and coverage parsing into a single effect
    useEffect(() => {
        if (!fileId || !fileType) {
            setFile(null)
            setError(null)
            setLoading(false)
            return
        }

        let coverage: { coveredLines: number[]; uncoveredLines: number[] } | undefined

        if (coverageParam) {
            try {
                coverage = JSON.parse(decodeURIComponent(coverageParam))
            } catch (e: unknown) {
                console.error('Failed to parse coverage data:', e)
            }
        }

        // Only fetch if we have valid params
        const fetchData = async () => {
            try {
                setLoading(true)
                const refreshToken = localStorage.getItem('sf_refresh_token')
                if (!refreshToken) throw new Error('No refresh token found')

                const { access_token, instance_url } = await refreshAccessToken(refreshToken)
                const objectType = fileType.toLowerCase()

                const response = await fetch(
                    `/api/salesforce/${objectType}/${fileId}?instance_url=${encodeURIComponent(instance_url)}`,
                    {
                        headers: { Authorization: `Bearer ${access_token}` },
                    },
                )

                if (!response.ok) throw new Error('Failed to fetch file')

                const data = await response.json()

                setFile({
                    Id: fileId,
                    Name: data.Name || 'Unnamed File',
                    Body: typeof data.Body === 'string' ? data.Body : JSON.stringify(data.Body, null, 2),
                    Coverage: coverage,
                    files: data.files,
                })
            } catch (error: unknown) {
                console.error('Error:', error)
                setError(error instanceof Error ? error.message : 'Failed to fetch file')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [fileId, fileType, coverageParam])

    const handleClose = () => {
        // Clear the file state
        setFile(null)
        setError(null)
        // Replace the current URL with the base path
        router.replace('/explore')
    }

    // Add logging for render phase
    console.log('ExplorePage render:', {
        file: file?.Id,
        coverage: file?.Coverage,
        loading,
        error,
    })

    if (loading) {
        return (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
        )
    }

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>
    }

    if (!file) {
        return (
            <div className="h-full flex flex-col p-4">
                <div className="h-full flex items-center justify-center">
                    <Button variant="outline" onClick={() => setIsFileModalOpen(true)} className="text-md">
                        Select a file to view
                    </Button>
                    <FileSelectionModal
                        open={isFileModalOpen}
                        onOpenChange={setIsFileModalOpen}
                        onFileSelect={(id, type) => {
                            router.push(`/explore?id=${id}&type=${type}`)
                            setIsFileModalOpen(false)
                        }}
                    />
                </div>
            </div>
        )
    }

    const getLanguage = (type: string | null = '') => {
        if (!type) return 'apex' // Default to apex if no type provided

        switch (type.toLowerCase()) {
            case 'apexclass':
            case 'apextrigger':
                return 'apex'
            case 'lightningcomponentbundle':
            case 'auradefinitionbundle':
                return 'javascript'
            default:
                return 'apex'
        }
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold">{file?.Name}</h1>
                    <FileSelectionModal
                        onFileSelect={(id, type) => {
                            router.push(`/explore?id=${id}&type=${type}`)
                        }}
                    />
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        router.push('/explore')
                        setFile(null)
                    }}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-hidden">
                {file?.files && file.files.length > 1 ? (
                    <BundleViewer files={file.files} />
                ) : (
                    <CodeViewer
                        content={file?.Body ?? ''}
                        language={getLanguage(fileType)}
                        coveredLines={file?.Coverage?.coveredLines}
                        uncoveredLines={file?.Coverage?.uncoveredLines}
                    />
                )}
            </div>
        </div>
    )
}
