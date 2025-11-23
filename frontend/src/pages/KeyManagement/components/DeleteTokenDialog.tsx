import { Dialog, Button } from "../../../components/ui"
import type { ApiToken } from "../../../types"

interface DeleteTokenDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  token: ApiToken | null
}

export function DeleteTokenDialog({
  isOpen,
  onClose,
  onConfirm,
  token
}: DeleteTokenDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="删除 Token"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            确认删除
          </Button>
        </>
      }
    >
      {token && (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            确定要删除 Token <strong>{token.name}</strong> 吗？
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            此操作无法撤销。
          </p>
        </div>
      )}
    </Dialog>
  )
}

