import { useState } from "react"
import { Card, CardContent, CardHeader, Button } from "../../../components/ui"
import { api } from "../../../services/api"
import toast from "react-hot-toast"

export function ExportSection() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportAll = async () => {
    setIsExporting(true)
    try {
      const response = await api.exportData()
      const data = response.data.data

      // 创建下载链接
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `web-api-hub-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("导出成功")
    } catch (error: any) {
      toast.error(error.response?.data?.error || "导出失败")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          导出数据
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          导出您的账号数据和设置
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            导出所有数据（账号、设置等）
          </p>
          <Button
            onClick={handleExportAll}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? "导出中..." : "导出所有数据"}
          </Button>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>提示：</strong>
            导出的数据包含所有账号信息和设置，可用于备份或迁移到其他设备。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

