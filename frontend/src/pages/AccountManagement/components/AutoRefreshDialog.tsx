import { useState, useEffect } from "react"
import { Dialog } from "../../../components/ui/Dialog"
import { Button } from "../../../components/ui/Button"
import { Input } from "../../../components/ui/Input"
import { Label } from "../../../components/ui/Label"
import { api } from "../../../services/api"
import toast from "react-hot-toast"
import type { DisplaySiteData } from "../../../types"

interface AutoRefreshDialogProps {
  isOpen: boolean
  onClose: () => void
  accounts: DisplaySiteData[]
  onSuccess?: () => void
}

export function AutoRefreshDialog({
  isOpen,
  onClose,
  accounts,
  onSuccess
}: AutoRefreshDialogProps) {
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set())
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(6)
  const [isSaving, setIsSaving] = useState(false)

  // 初始化：选择所有已启用自动刷新的账号，并加载设置状态
  useEffect(() => {
    if (isOpen && accounts.length > 0) {
      // 从账号数据中获取已启用自动刷新的账号
      const enabledAccounts = accounts.filter(
        (acc) => acc.autoRefreshEnabled === true
      )
      
      // 设置选中的账号
      if (enabledAccounts.length > 0) {
        setSelectedAccountIds(new Set(enabledAccounts.map((acc) => acc.id)))
        // 使用第一个启用账号的间隔设置，或使用默认值
        const firstInterval = enabledAccounts[0]?.autoRefreshInterval
        setAutoRefreshInterval(firstInterval && firstInterval > 0 ? firstInterval : 6)
        setAutoRefreshEnabled(true)
      } else {
        // 没有启用自动刷新的账号，重置状态
        setSelectedAccountIds(new Set())
        setAutoRefreshInterval(6)
        setAutoRefreshEnabled(false)
      }
    }
  }, [isOpen, accounts])

  const handleToggleAccount = (accountId: string) => {
    const newSelected = new Set(selectedAccountIds)
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId)
    } else {
      newSelected.add(accountId)
    }
    setSelectedAccountIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedAccountIds.size === accounts.length) {
      setSelectedAccountIds(new Set())
    } else {
      setSelectedAccountIds(new Set(accounts.map((acc) => acc.id)))
    }
  }

  const handleSave = async () => {
    if (selectedAccountIds.size === 0 && autoRefreshEnabled) {
      toast.error("请至少选择一个账号")
      return
    }

    if (autoRefreshEnabled && (autoRefreshInterval < 1 || autoRefreshInterval > 1440)) {
      toast.error("刷新间隔必须在 1-1440 分钟之间")
      return
    }

    setIsSaving(true)
    try {
      await api.updateAccountAutoRefresh({
        accountIds: Array.from(selectedAccountIds),
        autoRefreshEnabled,
        autoRefreshInterval: autoRefreshEnabled ? autoRefreshInterval : undefined
      })

      toast.success("自动刷新设置已保存")
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "保存失败")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="自动刷新设置"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          选择需要自动刷新的账号并设置刷新间隔
        </p>

        {/* 启用开关 */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              启用自动刷新
            </span>
          </label>
        </div>

        {/* 刷新间隔 */}
        {autoRefreshEnabled && (
          <div>
            <Label htmlFor="interval">刷新间隔（分钟）</Label>
            <Input
              id="interval"
              type="number"
              min="1"
              max="1440"
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(parseInt(e.target.value) || 6)}
              className="mt-1"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              设置自动刷新账号数据的间隔时间（1-1440 分钟）
            </p>
          </div>
        )}

        {/* 账号选择 */}
        {autoRefreshEnabled && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>选择账号</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedAccountIds.size === accounts.length ? "取消全选" : "全选"}
              </Button>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 max-h-[300px] overflow-y-auto">
              {accounts.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  暂无账号
                </p>
              ) : (
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <label
                      key={account.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAccountIds.has(account.id)}
                        onChange={() => handleToggleAccount(account.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                        {account.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {account.site_url}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              已选择 {selectedAccountIds.size} / {accounts.length} 个账号
            </p>
          </div>
        )}

        {/* 提示信息 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>提示：</strong>
            自动刷新功能会在后台定时刷新选中账号的余额和使用统计信息。
            刷新间隔越短，数据越及时，但也会增加服务器负载。
          </p>
        </div>
      </div>
    </Dialog>
  )
}
