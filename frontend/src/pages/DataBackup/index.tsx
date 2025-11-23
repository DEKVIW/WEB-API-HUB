import { useState } from "react"
import { Card, CardContent, Label, Input, Button, Select, Alert } from "../../components/ui"
import { usePreferencesStore } from "../../store/preferencesStore"
import { api } from "../../services/api"
import { ExportSection } from "../ImportExport/components/ExportSection"
import { ImportSection } from "../ImportExport/components/ImportSection"
import toast from "react-hot-toast"

export default function DataBackup() {
  const { preferences, updatePreferences } = usePreferencesStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSave = async (field: string, value: any) => {
    setIsSaving(true)
    try {
      await updatePreferences({ [field]: value })
      toast.success("设置已保存")
    } catch (error: any) {
      toast.error(error.response?.data?.error || "保存失败")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    if (!preferences?.webdavUrl || !preferences?.webdavUsername || !preferences?.webdavPassword) {
      toast.error("请先填写完整的 WebDAV 配置")
      return
    }

    setIsTesting(true)
    try {
      const response = await api.testWebdavConnection({
        url: preferences.webdavUrl,
        username: preferences.webdavUsername,
        password: preferences.webdavPassword
      })
      if (response.data.success) {
        toast.success(response.data.message || "连接测试成功")
      } else {
        toast.error(response.data.message || "连接测试失败")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "连接测试失败")
    } finally {
      setIsTesting(false)
    }
  }

  const handleUploadBackup = async () => {
    if (!preferences?.webdavUrl || !preferences?.webdavUsername || !preferences?.webdavPassword) {
      toast.error("请先填写完整的 WebDAV 配置")
      return
    }

    setIsSaving(true)
    try {
      const response = await api.uploadWebdavBackup({
        url: preferences.webdavUrl,
        username: preferences.webdavUsername,
        password: preferences.webdavPassword
      })
      if (response.data.success) {
        toast.success(response.data.message || "上传成功")
      } else {
        toast.error(response.data.message || "上传失败")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "上传失败")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadBackup = async () => {
    if (!preferences?.webdavUrl || !preferences?.webdavUsername || !preferences?.webdavPassword) {
      toast.error("请先填写完整的 WebDAV 配置")
      return
    }

    setIsSaving(true)
    try {
      const response = await api.downloadWebdavBackup({
        url: preferences.webdavUrl,
        username: preferences.webdavUsername,
        password: preferences.webdavPassword
      })
      if (response.data.success) {
        toast.success(response.data.message || `导入成功，已导入 ${response.data.imported || 0} 条记录`)
        // 可以刷新页面数据
        window.location.reload()
      } else {
        toast.error(response.data.message || "下载并导入失败")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "下载并导入失败")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleAutoSync = async (enabled: boolean) => {
    setIsSaving(true)
    try {
      await updatePreferences({
        webdavAutoSyncEnabled: enabled,
        webdavAutoSyncInterval: enabled
          ? preferences?.webdavAutoSyncInterval || 60
          : preferences?.webdavAutoSyncInterval
      })
      toast.success(enabled ? "自动同步已启用" : "自动同步已禁用")
    } catch (error: any) {
      toast.error(error.response?.data?.error || "更新失败")
    } finally {
      setIsSaving(false)
    }
  }

  if (!preferences) {
    return <div className="text-center py-8 text-gray-500">加载中...</div>
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          数据备份 <span className="text-base font-normal text-gray-600 dark:text-gray-400">(备份和恢复您的数据)</span>
        </h1>
      </div>

      <div className="space-y-6">
        {/* JSON 导入导出 */}
        <Card>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                JSON 导入/导出
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                使用 JSON 格式导入和导出数据，实现数据备份和恢复。
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExportSection />
              <ImportSection />
            </div>
            <Alert variant="info">
              <p className="text-sm">
                建议搭配 WebDAV 备份，实现双重备份，确保数据安全。
              </p>
            </Alert>
          </CardContent>
        </Card>

        {/* WebDAV 配置 */}
        <Card>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                WebDAV 备份配置
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                配置 WebDAV 服务器信息，实现数据自动备份和同步。
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="webdavUrl">WebDAV 地址</Label>
                  <Input
                    id="webdavUrl"
                    type="url"
                    placeholder="https://webdav.example.com"
                    value={preferences.webdavUrl || ""}
                    onChange={(e) => handleSave("webdavUrl", e.target.value)}
                    disabled={isSaving}
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    WebDAV 服务器的完整 URL 地址
                  </p>
                </div>

                <div>
                  <Label htmlFor="webdavUsername">用户名</Label>
                  <Input
                    id="webdavUsername"
                    type="text"
                    placeholder="输入用户名"
                    value={preferences.webdavUsername || ""}
                    onChange={(e) => handleSave("webdavUsername", e.target.value)}
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <Label htmlFor="webdavPassword">密码</Label>
                  <div className="flex gap-2">
                    <Input
                      id="webdavPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="输入密码"
                      value={preferences.webdavPassword || ""}
                      onChange={(e) => handleSave("webdavPassword", e.target.value)}
                      disabled={isSaving}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSaving}
                    >
                      {showPassword ? "隐藏" : "显示"}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleTestConnection}
                    disabled={isTesting || isSaving || !preferences.webdavUrl || !preferences.webdavUsername || !preferences.webdavPassword}
                    variant="outline"
                  >
                    {isTesting ? "测试中..." : "测试连接"}
                  </Button>
                  <Button
                    onClick={handleUploadBackup}
                    disabled={isSaving || isTesting || !preferences.webdavUrl || !preferences.webdavUsername || !preferences.webdavPassword}
                    variant="default"
                  >
                    {isSaving ? "上传中..." : "上传备份"}
                  </Button>
                  <Button
                    onClick={handleDownloadBackup}
                    disabled={isSaving || isTesting || !preferences.webdavUrl || !preferences.webdavUsername || !preferences.webdavPassword}
                    variant="outline"
                  >
                    {isSaving ? "下载中..." : "下载并导入"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WebDAV 自动同步设置 */}
        <Card>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                WebDAV 自动同步设置
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                配置自动同步策略，定时备份数据到 WebDAV 服务器。
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      启用自动同步
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      定时将数据同步到 WebDAV 服务器
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.webdavAutoSyncEnabled || false}
                      onChange={(e) => handleToggleAutoSync(e.target.checked)}
                      disabled={isSaving}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>

                {preferences.webdavAutoSyncEnabled && (
                  <>
                    <div>
                      <Label htmlFor="syncInterval">同步间隔（分钟）</Label>
                      <Input
                        id="syncInterval"
                        type="number"
                        min="1"
                        max="1440"
                        value={preferences.webdavAutoSyncInterval || 60}
                        onChange={(e) =>
                          handleSave("webdavAutoSyncInterval", parseInt(e.target.value) || 60)
                        }
                        disabled={isSaving}
                      />
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        设置自动同步的间隔时间（1-1440 分钟）
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="syncStrategy">同步策略</Label>
                      <Select
                        id="syncStrategy"
                        value={preferences.webdavSyncStrategy || "merge"}
                        onChange={(e) => handleSave("webdavSyncStrategy", e.target.value)}
                        disabled={isSaving}
                      >
                        <option value="merge">合并（双向同步）</option>
                        <option value="upload">仅上传</option>
                        <option value="download">仅下载</option>
                      </Select>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        选择数据同步策略
                      </p>
                    </div>
                  </>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>提示：</strong>
                    WebDAV 自动同步功能需要先配置 WebDAV 服务器信息并测试连接成功。
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

