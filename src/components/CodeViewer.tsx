import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { StreamLanguage } from '@codemirror/language'
import { java } from '@codemirror/legacy-modes/mode/clike'
import { javascript } from '@codemirror/lang-javascript'
import { xml } from '@codemirror/lang-xml'
import { vscodeLightInit } from '@uiw/codemirror-theme-vscode'
import { EditorState } from '@codemirror/state'
import { highlightSpecialChars, Decoration, DecorationSet, EditorView } from '@codemirror/view'

interface CodeViewerProps {
  content: string
  language: 'apex' | 'javascript' | 'html' | 'xml'
  coveredLines?: number[]
  uncoveredLines?: number[]
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

// Create line decoration themes
const coveredLineTheme = Decoration.line({
  attributes: { class: "bg-green-50" }
})

const uncoveredLineTheme = Decoration.line({
  attributes: { class: "bg-red-50" }
})

const createLineDecorations = (view: EditorView, coveredLines: number[] = [], uncoveredLines: number[] = []) => {
  const decorations: Range<Decoration>[] = []
  const doc = view.state.doc

  // Add decorations for covered lines
  for (let lineNo of coveredLines) {
    try {
      const line = doc.line(lineNo)
      decorations.push(coveredLineTheme.range(line.from))
    } catch (e) {
      console.warn(`Skipping invalid covered line number: ${lineNo}`)
    }
  }

  // Add decorations for uncovered lines
  for (let lineNo of uncoveredLines) {
    try {
      const line = doc.line(lineNo)
      decorations.push(uncoveredLineTheme.range(line.from))
    } catch (e) {
      console.warn(`Skipping invalid uncovered line number: ${lineNo}`)
    }
  }

  // Sort decorations by their 'from' position
  decorations.sort((a, b) => a.from - b.from)

  return Decoration.set(decorations, true)
}

export function CodeViewer({ 
  content, 
  language, 
  coveredLines = [], 
  uncoveredLines = [],
}: CodeViewerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Ensure content is a string
  const stringContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2)

  // Create the coverage highlighting extension
  const coverageHighlightExtension = EditorView.decorations.of(view => {
    return createLineDecorations(view, coveredLines, uncoveredLines)
  })

  return (
    <div className="h-full overflow-auto">
      <CodeMirror
        value={stringContent}
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
          EditorState.tabSize.of(4),
          coverageHighlightExtension
        ]}
        className="border rounded-md"
      />
    </div>
  )
} 