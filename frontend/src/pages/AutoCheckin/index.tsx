import { useEffect, useState, useMemo } from "react"
import { api } from "../../services/api"
import { Card, CardContent, Button, EmptyState } from "../../components/ui"
import type { AutoCheckinStatus, CheckinHistoryItem } from "../../types/checkin"
import toast from "react-hot-toast"

type FilterStatus = "all" | "success" | "failed"

export default function AutoCheckin() {
  const [status, setStatus] = useState<AutoCheckinStatus | null>(null)
  const [history, setHistory] = useState<CheckinHistoryItem[]>([])
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    loadStatus()
    loadHistory()
  }, [])

  const loadStatus = async () => {
    try {
      const response = await api.getCheckinStatus()
      setStatus(response.data.data)
    } catch (error: any) {
      console.error("Failed to load status:", error)
      toast.error(error.response?.data?.error || "加载状态失败")
    } finally {
      setIsLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const response = await api.getCheckinHistory({ page: 1, pageSize: 100 })
      setHistory(response.data.data.items || [])
    } catch (error: any) {
      console.error("Failed to load history:", error)
    }
  }

  const handleRunNow = async () => {
    setIsRunning(true)
    try {
      await api.runCheckin()
      toast.success("签到执行完成")
      await Promise.all([loadStatus(), loadHistory()])
    } catch (error: any) {
      toast.error(error.response?.data?.error || "执行签到失败")
    } finally {
      setIsRunning(false)
    }
  }

  const filteredHistory = useMemo(() => {
    let filtered = history

    // 状态筛选
    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => {
        if (filterStatus === "success") {
          return item.status === "success" || item.status === "alreadyChecked"
        }
        return item.status === filterStatus
      })
    }

    // 搜索筛选
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.accountName.toLowerCase().includes(keyword) ||
          item.message?.toLowerCase().includes(keyword)
      )
    }

    return filtered
  }, [history, filterStatus, searchKeyword])

  const formatDateTime = (isoString?: string): string => {
    if (!isoString) return "未计划"
    try {
      const date = new Date(isoString)
      return date.toLocaleString("zh-CN")
    } catch {
      return "未计划"
    }
  }

  const formatTimestamp = (timestamp: number): string => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString("zh-CN")
    } catch {
      return "-"
    }
  }

  const getResultBadgeColor = (
    result?: "success" | "partial" | "failed"
  ): string => {
    switch (result) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "partial":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            ✓ 成功
          </span>
        )
      case "alreadyChecked":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            ✓ 已签到
          </span>
        )
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
            ✗ 失败
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {status}
          </span>
        )
    }
  }

  const accountResults = status?.perAccount
    ? Object.values(status.perAccount)
    : []
  const successCount = accountResults.filter(
    (r: any) => r.status === "success" || r.status === "alreadyChecked"
  ).length
  const failedCount = accountResults.filter((r: any) => r.status === "failed").length

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          加载中...
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            自动签到
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            在每天的指定时间窗口内，自动为符合条件的账号执行签到
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadStatus} variant="outline">
            刷新
          </Button>
          <Button onClick={handleRunNow} disabled={isRunning}>
            {isRunning ? "执行中..." : "立即执行"}
          </Button>
        </div>
      </div>

      {/* 状态卡片 */}
      {status && (
        <Card className="mb-6">
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  最近运行
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {formatDateTime(status.lastRunAt)}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  下次计划
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {formatDateTime(status.nextScheduledAt)}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  执行结果
                </div>
                <div className="mt-1">
                  {status.lastRunResult && (
                    <span
                      className={`inline-block rounded px-2 py-1 text-sm font-medium ${getResultBadgeColor(status.lastRunResult)}`}
                    >
                      {status.lastRunResult === "success"
                        ? "成功"
                        : status.lastRunResult === "partial"
                          ? "部分成功"
                          : "失败"}
                    </span>
                  )}
                  {!status.lastRunResult && (
                    <span className="text-lg font-semibold text-gray-400">-</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  账号（成功 / 失败 / 总计）
                </div>
                <div className="mt-1 text-lg font-semibold">
                  <span className="text-green-600 dark:text-green-400">
                    {successCount}
                  </span>
                  {" / "}
                  <span className="text-red-600 dark:text-red-400">
                    {failedCount}
                  </span>
                  {" / "}
                  <span>{accountResults.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 历史记录 */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          签到历史
        </h2>

        {/* 筛选栏 */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            {(["all", "success", "failed"] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filterStatus === status
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {status === "all"
                  ? "全部"
                  : status === "success"
                    ? "成功"
                    : "失败"}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="搜索账号名称或消息..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 历史记录表格 */}
        {filteredHistory.length === 0 ? (
          <EmptyState
            title={searchKeyword || filterStatus !== "all" ? "没有匹配的结果" : "暂无执行历史"}
            description={
              searchKeyword || filterStatus !== "all"
                ? "尝试修改筛选条件或搜索关键字"
                : '点击"立即执行"对所有符合条件的账号进行自动签到'
            }
          />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      账号名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      消息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      时间
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {filteredHistory.map((item, index) => (
                    <tr
                      key={`${item.accountId}-${item.timestamp}-${index}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.accountName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {item.message || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatTimestamp(item.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

