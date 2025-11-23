import { Card, CardContent, Button, Badge } from "../../../components/ui"
import { formatBalance, formatRelativeTime } from "../../../utils/formatters"
import type { DisplaySiteData } from "../../../types"

interface AccountListItemProps {
  account: DisplaySiteData
  onRefresh: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function AccountListItem({
  account,
  onRefresh,
  onEdit,
  onDelete
}: AccountListItemProps) {
  const healthVariant = {
    healthy: "success" as const,
    warning: "warning" as const,
    error: "error" as const,
    unknown: "info" as const
  }[account.health.status]

  return (
    <Card variant="interactive">
      <CardContent>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {account.name}
              </h3>
              <Badge variant={healthVariant}>{account.health.status}</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {account.site_url}
            </p>
            {account.username && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                用户: {account.username}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefresh(account.id)}
            >
              刷新
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(account.id)}
            >
              编辑
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(account.id)}
            >
              删除
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">余额 (USD)</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatBalance(account.balance.USD, "USD")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">余额 (CNY)</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatBalance(account.balance.CNY, "CNY")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">今日消耗</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatBalance(account.todayConsumption.USD, "USD")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">今日收入</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatBalance(account.todayIncome.USD, "USD")}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Token: {account.todayTokens.upload + account.todayTokens.download}
            </span>
            <span>同步: {formatRelativeTime(account.last_sync_time)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

