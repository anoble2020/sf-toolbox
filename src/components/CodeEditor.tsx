'use client'

import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { StreamLanguage } from '@codemirror/language'
import { java } from '@codemirror/legacy-modes/mode/clike'
import { xcodeDark, xcodeLight } from '@uiw/codemirror-theme-xcode'
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
            theme={isDark ? xcodeDark : xcodeLight}
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
