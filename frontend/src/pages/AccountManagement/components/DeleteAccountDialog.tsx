import { Dialog, Button } from "../../../components/ui"
import type { DisplaySiteData } from "../../../types"

interface DeleteAccountDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  account: DisplaySiteData | null
  isLoading?: boolean
}

export function DeleteAccountDialog({
  isOpen,
  onClose,
  onConfirm,
  account,
  isLoading = false
}: DeleteAccountDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="删除账号"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            取消
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "删除中..." : "确认删除"}
          </Button>
        </>
      }
    >
      {account && (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            确定要删除账号 <strong>{account.name}</strong> 吗？
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            此操作无法撤销，所有相关数据将被永久删除。
          </p>
        </div>
      )}
    </Dialog>
  )
}

