import { Card, CardContent, Button, Badge } from "../../../components/ui"
import { formatBalance, formatRelativeTime } from "../../../utils/formatters"
import type { DisplaySiteData } from "../../../types"
import type { MouseEvent } from "react"

// 外链图标组件
const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
)

interface AccountCardProps {
  account: DisplaySiteData
  onRefresh: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function AccountCard({
  account,
  onRefresh,
  onEdit,
  onDelete
}: AccountCardProps) {
  const healthVariant = {
    healthy: "success" as const,
    warning: "warning" as const,
    error: "error" as const,
    unknown: "info" as const
  }[account.health.status]

  const handleSiteClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (account.site_url) {
      window.open(account.site_url, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <Card
      variant="interactive"
      className="group hover:shadow-lg transition-all duration-300 flex flex-col h-full min-w-[280px]"
    >
      <CardContent className="p-4 flex flex-col h-full">
        {/* 标题区域 */}
        <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSiteClick}
            className="flex items-center gap-1.5 text-base md:text-lg font-bold text-gray-900 dark:text-white flex-1 min-w-0 pr-2 text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/title cursor-pointer"
          >
            <span className="truncate">{account.name}</span>
            <ExternalLinkIcon className="h-4 w-4 shrink-0 opacity-0 group-hover/title:opacity-100 transition-opacity" />
          </button>
          <Badge variant={healthVariant} className="shrink-0">
            {account.health.status === "healthy"
              ? "正常"
              : account.health.status === "warning"
              ? "警告"
              : account.health.status === "error"
              ? "错误"
              : "未知"}
          </Badge>
        </div>

        {/* 内容区域 - 渐变徽标样式 */}
        <div className="flex flex-wrap gap-2 mb-3 flex-1">
          {/* 余额USD - 金色渐变 */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-md shadow-sm">
            <span className="text-xs text-white/90 font-medium">余额</span>
            <span className="text-sm font-semibold text-white">
              {formatBalance(account.balance.USD, "USD")}
            </span>
          </div>

          {/* 今日消耗 - 橙红渐变 */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-md shadow-sm">
            <span className="text-xs text-white/90 font-medium">消耗</span>
            <span className="text-sm font-semibold text-white">
              {formatBalance(account.todayConsumption.USD, "USD")}
            </span>
          </div>

          {/* 今日收入 - 青绿渐变 */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-md shadow-sm">
            <span className="text-xs text-white/90 font-medium">收入</span>
            <span className="text-sm font-semibold text-white">
              {formatBalance(account.todayIncome.USD, "USD")}
            </span>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span>
            Token:{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {account.todayTokens.upload + account.todayTokens.download}
            </span>
          </span>
          <span>
            同步:{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {formatRelativeTime(account.last_sync_time)}
            </span>
          </span>
        </div>

        {/* 操作区域 */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              onRefresh(account.id)
            }}
            className="h-8 text-xs"
          >
            刷新
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              onEdit(account.id)
            }}
            className="h-8 text-xs"
          >
            编辑
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              onDelete(account.id)
            }}
            className="h-8 text-xs"
          >
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
