import { useEffect, useState, useMemo } from "react"
import { api } from "../../services/api"
import { Button, EmptyState } from "../../components/ui"
import { AccountSearchInput } from "../AccountManagement/components/AccountSearchInput"
import { TokenList } from "./components/TokenList"
import { AddTokenDialog } from "./components/AddTokenDialog"
import { DeleteTokenDialog } from "./components/DeleteTokenDialog"
import type { DisplaySiteData, ApiToken } from "../../types"
import toast from "react-hot-toast"

export default function KeyManagement() {
  const [accounts, setAccounts] = useState<DisplaySiteData[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingToken, setEditingToken] = useState<ApiToken | null>(null)
  const [deletingToken, setDeletingToken] = useState<ApiToken | null>(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (selectedAccountId) {
      loadTokens()
    } else {
      setTokens([])
    }
  }, [selectedAccountId])

  const loadAccounts = async () => {
    try {
      const response = await api.getAccounts(true)
      setAccounts(response.data.data)
      if (response.data.data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(response.data.data[0].id)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "加载账号失败")
    }
  }

  const loadTokens = async () => {
    if (!selectedAccountId) return
    setIsLoading(true)
    try {
      // 使用 all=true 获取所有 Token（自动分页）
      const response = await api.getTokens(selectedAccountId, undefined, undefined, true)
      setTokens(response.data.data || [])
    } catch (error: any) {
      toast.error(error.response?.data?.error || "加载 Token 失败")
    } finally {
      setIsLoading(false)
    }
  }

  // selectedAccount is not used, removed to fix TypeScript error

  const filteredTokens = useMemo(() => {
    if (!searchTerm) return tokens
    const term = searchTerm.toLowerCase()
    return tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(term) ||
        token.group?.toLowerCase().includes(term)
    )
  }, [tokens, searchTerm])

  const handleCopyKey = async (key: string, name: string) => {
    const textToCopy = key.startsWith("sk-") ? key : `sk-${key}`
    
    // 检查是否支持 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy)
        toast.success(`已复制 ${name} 的 Token`)
        return
      } catch (error) {
        console.error("Clipboard API 失败:", error)
        // 降级到传统方法
      }
    }
    
    // 降级方案：使用 document.execCommand
    try {
      const textArea = document.createElement("textarea")
      textArea.value = textToCopy
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand("copy")
      document.body.removeChild(textArea)
      
      if (successful) {
        toast.success(`已复制 ${name} 的 Token`)
      } else {
        throw new Error("execCommand 失败")
      }
    } catch (error) {
      console.error("复制失败:", error)
      // 最后的降级方案：提示用户手动复制
      toast.error(`复制失败，请手动复制: ${textToCopy}`, {
        duration: 5000
      })
    }
  }

  const handleEdit = (token: ApiToken) => {
    setEditingToken(token)
    setIsAddDialogOpen(true)
  }

  const handleDelete = (token: ApiToken) => {
    setDeletingToken(token)
  }

  const confirmDelete = async () => {
    if (!deletingToken || !selectedAccountId) return
    try {
      await api.deleteToken(selectedAccountId, deletingToken.id)
      toast.success("删除成功")
      await loadTokens()
      setDeletingToken(null)
    } catch (error: any) {
      toast.error(error.response?.data?.error || "删除失败")
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            密钥管理 <span className="text-base font-normal text-gray-600 dark:text-gray-400">(管理您的 API Token 和密钥)</span>
          </h1>
        </div>
        <Button
          onClick={() => {
            setEditingToken(null)
            setIsAddDialogOpen(true)
          }}
          disabled={!selectedAccountId || accounts.length === 0}
        >
          添加 Token
        </Button>
      </div>

      <div className="mb-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            选择账号
          </label>
          <select
            value={selectedAccountId || ""}
            onChange={(e) => setSelectedAccountId(e.target.value || null)}
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">选择账号</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {selectedAccountId && (
          <AccountSearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索 Token 名称、Key 或分组..."
          />
        )}
      </div>

      {!selectedAccountId ? (
        <EmptyState
          title="请选择账号"
          description="从上方下拉菜单中选择一个账号以查看其 Token"
        />
      ) : (
        <TokenList
          tokens={filteredTokens}
          isLoading={isLoading}
          onCopyKey={handleCopyKey}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <AddTokenDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false)
          setEditingToken(null)
        }}
        onSuccess={loadTokens}
        accountId={selectedAccountId}
        accounts={accounts}
        editingToken={editingToken}
      />

      <DeleteTokenDialog
        isOpen={!!deletingToken}
        onClose={() => setDeletingToken(null)}
        onConfirm={confirmDelete}
        token={deletingToken}
      />
    </div>
  )
}

