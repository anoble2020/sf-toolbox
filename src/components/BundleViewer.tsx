import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeViewer } from "@/components/CodeViewer"

interface BundleFile {
  name: string
  content: string
  type: string
}

interface BundleViewerProps {
  files: BundleFile[]
}

export function BundleViewer({ files }: BundleViewerProps) {
  console.log('BundleViewer received files:', files)

  return (
    <Tabs defaultValue={files[0]?.name} className="h-full flex flex-col">
      <div className="border-b px-4">
        <TabsList>
          {files.map((file) => {
            console.log('Rendering tab for file:', file.name)
            return (
              <TabsTrigger 
                key={file.name} 
                value={file.name}
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                {file.name}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </div>
      <div className="flex-1 overflow-hidden p-4">
        {files.map((file) => {
          console.log('Rendering content for file:', file.name)
          return (
            <TabsContent 
              key={file.name} 
              value={file.name} 
              className="mt-0 h-full data-[state=active]:flex-1"
            >
              <CodeViewer
                content={file.content}
                language={file.type}
              />
            </TabsContent>
          )
        })}
      </div>
    </Tabs>
  )
} 