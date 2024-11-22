'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CodeViewer } from '@/components/CodeViewer'
import { FileSelectionModal } from '@/components/FileSelectionModal'
import { Button } from '@/components/ui/button'
import { X, FolderOpen, Loader2 } from 'lucide-react'
import { refreshAccessToken } from '@/lib/auth'

interface FileMetadata {
  Id: string
  Name: string
  Body: string
  Coverage?: {
    coveredLines: number[]
    uncoveredLines: number[]
  }
}

export default function ExplorePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isFileModalOpen, setIsFileModalOpen] = useState(false)
  const [file, setFile] = useState<FileMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileId = searchParams.get('id')
  const fileType = searchParams.get('type')
  const coverageParam = searchParams.get('coverage')

  // Reset state when URL params change
  useEffect(() => {
    if (!fileId || !fileType) {
      setFile(null)
      setError(null)
      setLoading(false)
    } else {
      // Parse coverage data if it exists
      let coverage
      if (coverageParam) {
        try {
          coverage = JSON.parse(decodeURIComponent(coverageParam))
        } catch (e) {
          console.error('Failed to parse coverage data:', e)
        }
      }
      
      fetchFile(coverage)
    }
  }, [fileId, fileType, coverageParam])

  const handleClose = () => {
    // Clear the file state
    setFile(null)
    setError(null)
    // Replace the current URL with the base path
    router.replace('/explore')
  }

  const fetchFile = async (coverage?: { coveredLines: number[], uncoveredLines: number[] }) => {
    if (!fileId) return

    try {
      setLoading(true)
      const refreshToken = localStorage.getItem('sf_refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token found')
      }

      const { access_token, instance_url } = await refreshAccessToken(refreshToken)

      const objectType = fileType?.toLowerCase()
      
      const response = await fetch(
        `/api/salesforce/${objectType}/${fileId}?instance_url=${encodeURIComponent(instance_url)}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch file')
      }

      const data = await response.json()
      
      setFile({
        Id: fileId,
        Name: data.Name || 'Unnamed File',
        Body: typeof data.Body === 'string' ? data.Body : JSON.stringify(data.Body, null, 2),
        Coverage: coverage
      })
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch file')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
      </div>
    )
  }

  if (!file) {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="h-full flex items-center justify-center">
          <Button
            variant="outline"
            onClick={() => setIsFileModalOpen(true)}
            className="text-md"
          >
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
        return 'javascript'
      case 'auradefinitionbundle':
        return 'html'
      default:
        return 'apex'
    }
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">{file.Name}</h1>
          {/*<Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFileModalOpen(true)}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Open File
          </Button>*/}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1">
        <CodeViewer
          content={file.Body}
          language={getLanguage(fileType)}
          coveredLines={file.Coverage?.coveredLines}
          uncoveredLines={file.Coverage?.uncoveredLines}
        />
      </div>

      <FileSelectionModal
        open={isFileModalOpen}
        onOpenChange={setIsFileModalOpen}
        onFileSelect={(id, type) => {
          router.push(`/explore?id=${id}&type=${type}`)
          setIsFileModalOpen(false)
        }}
      />
    </div>
  )
} 