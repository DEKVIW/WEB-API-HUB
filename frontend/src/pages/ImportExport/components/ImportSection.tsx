import { useState } from "react"
import { Card, CardContent, CardHeader, Button, Textarea, Label, Alert } from "../../../components/ui"
import { api } from "../../../services/api"
import toast from "react-hot-toast"

export function ImportSection() {
  const [importData, setImportData] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [validation, setValidation] = useState<{
    valid: boolean
    errors?: string[]
    hasAccounts?: boolean
    hasPreferences?: boolean
    timestamp?: string
  } | null>(null)

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setImportData(text)
      validateData(text)
    }
    reader.onerror = () => {
      toast.error("读取文件失败")
    }
    reader.readAsText(file)
  }

  const validateData = async (data: string) => {
    if (!data.trim()) {
      setValidation(null)
      return
    }

    try {
      const parsed = JSON.parse(data)
      const response = await api.validateImportData(parsed)
      const result = response.data.data

      setValidation({
        valid: result.valid,
        errors: result.errors,
        hasAccounts: !!parsed.accounts,
        hasPreferences: !!parsed.preferences,
        timestamp: parsed.timestamp
          ? new Date(parsed.timestamp).toLocaleString("zh-CN")
          : undefined
      })

      if (!result.valid) {
        toast.error(`数据格式错误: ${result.errors.join(", ")}`)
      }
    } catch (error: any) {
      setValidation({
        valid: false,
        errors: ["JSON 格式错误"]
      })
    }
  }

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setImportData(e.target.value)
    if (e.target.value.trim()) {
      validateData(e.target.value)
    } else {
      setValidation(null)
    }
  }

  const handleImport = async () => {
    if (!validation?.valid || !importData.trim()) {
      toast.error("请先验证数据格式")
      return
    }

    setIsImporting(true)
    try {
      const parsed = JSON.parse(importData)
      const response = await api.importData(parsed)
      const result = response.data.data

      toast.success(
        `导入成功！导入 ${result.importedCount} 个账号${
          result.migratedCount > 0 ? `，迁移 ${result.migratedCount} 个` : ""
        }`
      )

      // 清空数据
      setImportData("")
      setValidation(null)

      // 刷新页面（可选，或者通过事件通知其他组件）
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      toast.error(error.response?.data?.error || "导入失败")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          导入数据
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          从备份文件或 JSON 数据导入
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="file-input">选择备份文件</Label>
          <input
            id="file-input"
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-900/50"
          />
        </div>

        <div>
          <Label htmlFor="json-input">或粘贴 JSON 数据</Label>
          <Textarea
            id="json-input"
            value={importData}
            onChange={handlePaste}
            placeholder='{"version": "1.0", "accounts": {...}, ...}'
            rows={8}
            className="font-mono text-xs"
          />
        </div>

        {validation && (
          <Alert variant={validation.valid ? "success" : "error"}>
            <div>
              {validation.valid ? (
                <>
                  <p className="mb-2 font-medium">数据格式正确</p>
                  <div className="space-y-1 text-sm">
                    {validation.hasAccounts && (
                      <p>• 包含账号数据</p>
                    )}
                    {validation.hasPreferences && (
                      <p>• 包含用户设置</p>
                    )}
                    {validation.timestamp && (
                      <p>• 备份时间: {validation.timestamp}</p>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <p className="mb-1 font-medium">数据格式错误</p>
                  {validation.errors && validation.errors.length > 0 && (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </Alert>
        )}

        <Button
          onClick={handleImport}
          disabled={isImporting || !validation?.valid}
          className="w-full"
        >
          {isImporting ? "导入中..." : "导入数据"}
        </Button>

        <Alert variant="warning">
          <div>
            <p className="mb-2 font-medium">重要提示</p>
            <ul className="space-y-1 text-sm list-disc list-inside">
              <li>导入会合并现有数据，不会删除已有账号</li>
              <li>相同 URL 和 User ID 的账号会被更新</li>
              <li>导入前建议先导出当前数据作为备份</li>
              <li>导入成功后页面会自动刷新</li>
            </ul>
          </div>
        </Alert>
      </CardContent>
    </Card>
  )
}

