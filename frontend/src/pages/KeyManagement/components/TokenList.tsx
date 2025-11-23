import { Card, CardContent, EmptyState } from "../../../components/ui"
import { TokenListItem } from "./TokenListItem"
import type { ApiToken } from "../../../types"

interface TokenListProps {
  tokens: ApiToken[]
  isLoading: boolean
  onCopyKey: (key: string, name: string) => void
  onEdit: (token: ApiToken) => void
  onDelete: (token: ApiToken) => void
}

export function TokenList({
  tokens,
  isLoading,
  onCopyKey,
  onEdit,
  onDelete
}: TokenListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 md:gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 md:p-5 lg:p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (tokens.length === 0) {
    return (
      <EmptyState
        title="暂无 Token"
        description="点击上方按钮添加您的第一个 Token"
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {tokens.map((token) => (
        <TokenListItem
          key={token.id}
          token={token}
          isVisible={false}
          onToggleVisibility={() => {}}
          onCopyKey={() => onCopyKey(token.key, token.name)}
          onEdit={() => onEdit(token)}
          onDelete={() => onDelete(token)}
        />
      ))}
    </div>
  )
}

