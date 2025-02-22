'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CodeViewer } from '@/components/CodeViewer'
import { FileSelectionModal } from '@/components/FileSelectionModal'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import { refreshAccessToken } from '@/lib/auth'
import { BundleViewer } from '@/components/BundleViewer'
import { CACHE_DURATIONS } from '@/lib/constants'
import { storage } from '@/lib/storage'
import { FileItem } from '@/types/files'

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
    const currentDomain = storage.getCurrentDomain() as string
    
    // First check for cached files
    const cachedFiles = storage.getFromDomain(currentDomain, 'cached_files')
    if (cachedFiles) {
        const parsed = JSON.parse(cachedFiles)
        const lastFetched = parsed.lastFetched || 0
        const cacheAge = Date.now() - lastFetched
        
        // If cache is less than 1 hour old, use it
        if (cacheAge < CACHE_DURATIONS.LONG) {
            console.log('Using cached files')
            return parsed
        }
    }

    // If no cache or cache is old, fetch fresh data
    console.log('Fetching fresh files data')
    const refreshToken = storage.getFromDomain(currentDomain, 'refresh_token')
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
        const errorText = await response.text()
        console.error('Failed to fetch files:', errorText)
        throw new Error('Failed to fetch files')
    }

    const data = await response.json()
    
    // Cache the fresh data
    const filesData = {
        ...data,
        lastFetched: Date.now(),
    }
    storage.setForDomain(currentDomain, 'cached_files', JSON.stringify(filesData))
    
    return filesData
}

function ExploreContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [file, setFile] = useState<FileMetadata | null>(null)
    const [files, setFiles] = useState<Record<string, FileItem[]>>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fileId = searchParams.get('id')
    const fileType = searchParams.get('type')
    const coverageParam = searchParams.get('coverage')

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

        const fetchData = async () => {
            try {
                setLoading(true)
                const currentDomain = storage.getCurrentDomain() as string
                const refreshToken = storage.getFromDomain(currentDomain, 'refresh_token')
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
            } catch (error: any) {
                console.error('Error:', error)
                setError(error instanceof Error ? error.message : 'Failed to fetch file')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [fileId, fileType, coverageParam])

    useEffect(() => {
        const loadFiles = async () => {
            try {
                const data = await fetchFiles()
                console.log('Setting files state with:', data)
                setFiles({
                    apexClasses: data.apexClasses || [],
                    triggers: data.triggers || [],
                    lwc: data.lwc || [],
                    aura: data.aura || []
                })
            } catch (error: any) {
                console.error('Failed to load files:', error)
                setError(error instanceof Error ? error.message : 'Failed to load files')
            }
        }

        loadFiles()
    }, [])

    const handleClose = () => {
        setFile(null)
        setError(null)
        // Preserve org parameter when closing
        const org = searchParams.get('org')
        const params = new URLSearchParams()
        if (org) params.set('org', org)
        router.replace(`/explore${params.toString() ? `?${params.toString()}` : ''}`)
    }

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
                    <Button variant="outline" onClick={() => setIsModalOpen(true)} className="text-md">
                        Select a file to view
                    </Button>
                    <FileSelectionModal
                        open={isModalOpen}
                        onOpenChange={setIsModalOpen}
                        onFileSelect={(id, type) => {
                            // Preserve org parameter
                            const org = searchParams.get('org')
                            const params = new URLSearchParams({ id, type })
                            if (org) params.set('org', org)
                            router.push(`/explore?${params.toString()}`)
                            setIsModalOpen(false)
                        }}
                        files={files}
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
                        open={isModalOpen}
                        onOpenChange={setIsModalOpen}
                        onFileSelect={(id, type) => {
                            // Preserve org parameter
                            const org = searchParams.get('org')
                            const params = new URLSearchParams({ id, type })
                            if (org) params.set('org', org)
                            router.push(`/explore?${params.toString()}`)
                            setIsModalOpen(false)
                        }}
                        files={files}
                    />
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        // Preserve org parameter when closing
                        const org = searchParams.get('org')
                        const params = new URLSearchParams()
                        if (org) params.set('org', org)
                        router.push(`/explore${params.toString() ? `?${params.toString()}` : ''}`)
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

export default function ExplorePage() {
    return (
        <Suspense 
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading...</span>
                </div>
            }
        >
            <ExploreContent />
        </Suspense>
    )
}
