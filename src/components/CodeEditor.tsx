'use client'

import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { StreamLanguage } from '@codemirror/language'
import { java } from '@codemirror/legacy-modes/mode/clike'
import { vscodeLightInit } from '@uiw/codemirror-theme-vscode'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
}

export function CodeEditor({ value, onChange, language = 'apex' }: CodeEditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <CodeMirror
      value={value}
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
      onChange={onChange}
      extensions={[StreamLanguage.define(java)]}
      className="border rounded-md"
    />
  )
} 