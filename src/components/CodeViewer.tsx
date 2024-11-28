import { useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { StreamLanguage } from '@codemirror/language'
import { java } from '@codemirror/legacy-modes/mode/clike'
import { javascript } from '@codemirror/lang-javascript'
import { xml } from '@codemirror/lang-xml'
import { EditorState } from '@codemirror/state'
import { highlightSpecialChars, ViewPlugin, Decoration, DecorationSet } from '@codemirror/view'
import { useTheme } from 'next-themes'
import { xcodeDark, xcodeLight } from '@uiw/codemirror-theme-xcode'
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

// Define the decoration styles
const coveredLineStyle = Decoration.line({
    attributes: { style: 'background-color: rgba(34, 197, 94, 0.1) !important;' },
})

const uncoveredLineStyle = Decoration.line({
    attributes: { style: 'background-color: rgba(239, 68, 68, 0.1) !important;' },
})

function coverageHighlightPlugin(coveredLines: number[] = [], uncoveredLines: number[] = []) {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet

            constructor(view: any) {
                this.decorations = this.buildDecorations(view)
            }

            buildDecorations(view: any) {
                const builder: any[] = []

                for (let i = 1; i <= view.state.doc.lines; i++) {
                    const line = view.state.doc.line(i)
                    if (coveredLines.includes(i)) {
                        builder.push(coveredLineStyle.range(line.from))
                    } else if (uncoveredLines.includes(i)) {
                        builder.push(uncoveredLineStyle.range(line.from))
                    }
                }

                return Decoration.set(builder)
            }

            update(update: any) {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = this.buildDecorations(update.view)
                }
            }
        },
        {
            decorations: (v) => v.decorations,
            provide: () => EditorState.allowMultipleSelections.of(true),
        },
    )
}

export function CodeViewer({ content, language, coveredLines = [], uncoveredLines = [] }: CodeViewerProps) {
    const [mounted, setMounted] = useState(false)
    const { theme } = useTheme()

    console.log('coveredLines', coveredLines)
    console.log('uncoveredLines', uncoveredLines)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const stringContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2)

    const isDark = theme === 'dark'

    return (
        <div className="h-full overflow-auto">
            <CodeMirror
                value={stringContent}
                height="100%"
                theme={isDark ? xcodeDark : xcodeLight}
                editable={false}
                extensions={[
                    getLanguageExtension(language),
                    EditorState.readOnly.of(true),
                    highlightSpecialChars(),
                    EditorState.tabSize.of(4),
                    coverageHighlightPlugin(coveredLines, uncoveredLines),
                ]}
                className="border rounded-md"
            />
        </div>
    )
}
