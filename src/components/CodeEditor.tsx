'use client'

import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { StreamLanguage } from '@codemirror/language'
import { java } from '@codemirror/legacy-modes/mode/clike'
import { vscodeLightInit, vscodeDarkInit } from '@uiw/codemirror-theme-vscode'
import { EditorState } from '@codemirror/state'
import { useTheme } from 'next-themes'

interface CodeEditorProps {
    value: string
    onChange: (value: string) => void
    language?: string
}

export function CodeEditor({ value, onChange, language = 'apex' }: CodeEditorProps) {
    const [mounted, setMounted] = useState(false)
    const { theme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    const isDark = theme === 'dark'

    return (
        <CodeMirror
            value={value}
            height="auto"
            minHeight="200px"
            maxHeight="calc(100vh - 200px)"
            theme={isDark 
                ? vscodeDarkInit({
                    settings: {
                        background: '#1e1e1e',
                        foreground: '#d4d4d4',
                        selection: '#264f78',
                        selectionMatch: '#264f78',
                        lineHighlight: '#2a2d2e',
                    },
                })
                : vscodeLightInit({
                    settings: {
                        background: '#ffffff',
                        foreground: '#000000',
                        selection: '#add6ff',
                        selectionMatch: '#add6ff',
                        lineHighlight: '#f0f0f0',
                    },
                })
            }
            onChange={onChange}
            extensions={[
                StreamLanguage.define(java),
                EditorState.tabSize.of(4),
                EditorState.phrases.of({
                    'active-line-gutter': false,
                    'active-line-highlight': false,
                }),
            ]}
            className="border rounded-md overflow-y-auto"
            placeholder="Enter Anonymous Apex here..."
        />
    )
}
