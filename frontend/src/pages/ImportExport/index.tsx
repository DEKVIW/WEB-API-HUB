import { ExportSection } from "./components/ExportSection"
import { ImportSection } from "./components/ImportSection"

export default function ImportExport() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          导入/导出
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          备份和恢复您的数据
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExportSection />
        <ImportSection />
      </div>
    </div>
  )
}

