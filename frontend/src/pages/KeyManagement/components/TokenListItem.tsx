import { Card, CardContent, Button, Badge } from "../../../components/ui"
import type { ApiToken } from "../../../types"
import { formatDateTime, formatQuota } from "../../../utils/formatters"

interface TokenListItemProps {
  token: ApiToken
  isVisible: boolean
  onToggleVisibility: () => void
  onCopyKey: () => void
  onEdit: () => void
  onDelete: () => void
}

export function TokenListItem({
  token,
  isVisible: _isVisible,
  onToggleVisibility: _onToggleVisibility,
  onCopyKey,
  onEdit,
  onDelete
}: TokenListItemProps) {
  const statusVariant = token.status === 1 ? "success" : "error"

  return (
    <Card
      variant="interactive"
      className="group hover:shadow-lg transition-all duration-300 flex flex-col h-full min-w-[280px]"
    >
      <CardContent className="p-4 flex flex-col h-full">
        {/* 标题区域 */}
        <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white flex-1 min-w-0 pr-2">
            {token.name || `密钥 ${token.tokenId || token.id}` || "未命名密钥"}
          </h3>
          <Badge variant={statusVariant} className="shrink-0">
            {token.status === 1 ? "启用" : "禁用"}
          </Badge>
        </div>

        {/* 内容区域 - GitHub徽标样式 */}
        <div className="flex flex-wrap gap-2 mb-3 flex-1">
          {/* 剩余配额 */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
            <span className="text-xs text-gray-500 dark:text-gray-400">剩余</span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {formatQuota(token.remainQuota || 0, token.unlimited)}
            </span>
          </div>

          {/* 已用配额 */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
            <span className="text-xs text-gray-500 dark:text-gray-400">已用</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatQuota(token.usedQuota || 0, false)}
            </span>
          </div>

          {/* 分组 */}
          {token.group && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <span className="text-xs text-gray-500 dark:text-gray-400">分组</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {token.group}
              </span>
            </div>
          )}
        </div>

        {/* 时间信息 */}
        {(token.expiredTime || token.createdTime) && (
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
            {token.expiredTime && (
              <span>
                过期:{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatDateTime(
                    typeof token.expiredTime === "number"
                      ? token.expiredTime
                      : Number(token.expiredTime)
                  )}
                </span>
              </span>
            )}
            {token.createdTime && (
              <span>
                创建:{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatDateTime(
                    typeof token.createdTime === "number"
                      ? token.createdTime
                      : Number(token.createdTime)
                  )}
                </span>
              </span>
            )}
          </div>
        )}

        {/* 操作区域 */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCopyKey}
            className="h-8 text-xs"
          >
            复制
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-8 text-xs"
          >
            编辑
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onDelete}
            className="h-8 text-xs"
          >
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
