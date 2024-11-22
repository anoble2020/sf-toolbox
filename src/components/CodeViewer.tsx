import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { StreamLanguage } from '@codemirror/language'
import { java } from '@codemirror/legacy-modes/mode/clike'
import { javascript } from '@codemirror/lang-javascript'
import { xml } from '@codemirror/lang-xml'
import { vscodeLightInit } from '@uiw/codemirror-theme-vscode'
import { EditorState } from '@codemirror/state'
import { highlightSpecialChars } from '@codemirror/view'

interface CodeViewerProps {
  content: string
  language: 'apex' | 'javascript' | 'html' | 'xml'
  coveredLines?: number[]
  uncoveredLines?: number[]
  highlightedLines?: number[]
}

const getLanguageExtension = (language: string) => {
  switch (language) {
    case 'apex':
      return StreamLanguage.define(java)
    case 'javascript':
      return javascript()
    case 'html':
    case 'xml':
      return xml()
    default:
      return StreamLanguage.define(java)
  }
}

export function CodeViewer({ 
  content, 
  language, 
  coveredLines = [], 
  uncoveredLines = [],
  highlightedLines = []
}: CodeViewerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Create decoration markers for coverage
  const coverageMarkers = []
  
  if (coveredLines.length > 0) {
    coverageMarkers.push({
      from: 0,
      to: content.length,
      className: 'bg-green-50'
    })
  }
  
  if (uncoveredLines.length > 0) {
    coverageMarkers.push({
      from: 0,
      to: content.length,
      className: 'bg-red-50'
    })
  }

  return (
    <CodeMirror
      value={content}
      height="100%"
      theme={vscodeLightInit({
        settings: {
          background: '#ffffff',
          foreground: '#000000',
          selection: '#add6ff',
          selectionMatch: '#add6ff',
          lineHighlight: '#f0f0f0',
        }
      })}
      editable={false}
      extensions={[
        getLanguageExtension(language),
        EditorState.readOnly.of(true),
        highlightSpecialChars(),
        EditorState.tabSize.of(4)
      ]}
      className="border rounded-md"
    />
  )
} 