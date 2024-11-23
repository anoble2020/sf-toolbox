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
    <Tabs defaultValue={files[0]?.name} className="h-full flex flex-col mt-2">
      <div className="px-4">
        <TabsList>
          {files.map((file) => {
            console.log('Rendering tab for file:', file.name)
            return (
              <TabsTrigger 
                key={file.name} 
                value={file.name}
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