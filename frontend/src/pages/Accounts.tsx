import { useEffect, useState, useMemo } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { api } from "../services/api"
import { Button, EmptyState } from "../components/ui"
import { AccountSearchInput } from "./AccountManagement/components/AccountSearchInput"
import { AccountCard } from "./AccountManagement/components/AccountCard"
import { AccountDialog } from "./AccountManagement/components/AccountDialog"
import { DeleteAccountDialog } from "./AccountManagement/components/DeleteAccountDialog"
import { AutoRefreshDialog } from "./AccountManagement/components/AutoRefreshDialog"
import type { DisplaySiteData } from "../types"
import toast from "react-hot-toast"

// 拖拽手柄图标
const DragHandleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 8h16M4 16h16"
    />
  </svg>
)

// 可拖拽的账号卡片包装器
interface SortableAccountCardProps {
  account: DisplaySiteData
  onRefresh: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

function SortableAccountCard({
  account,
  onRefresh,
  onEdit,
  onDelete
}: SortableAccountCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: account.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 1
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group/drag">
      {/* 拖拽手柄 - 位于卡片左上角，hover 时显示 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1.5 left-1.5 z-10 p-1 rounded bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-sm opacity-0 group-hover/drag:opacity-100"
        title="拖拽排序"
      >
        <DragHandleIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
      </div>
      <AccountCard
        account={account}
        onRefresh={onRefresh}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<DisplaySiteData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<string | undefined>()
  const [deletingAccount, setDeletingAccount] = useState<DisplaySiteData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAutoRefreshDialogOpen, setIsAutoRefreshDialogOpen] = useState(false)

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // 移动8px后才开始拖拽，避免误触
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      const response = await api.getAccounts(true)
      setAccounts(response.data.data)
      setError("")
    } catch (err: any) {
      setError(err.response?.data?.error || "加载账号失败")
      toast.error(err.response?.data?.error || "加载账号失败")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAccounts = useMemo(() => {
    if (!searchTerm) return accounts
    const term = searchTerm.toLowerCase()
    return accounts.filter(
      (account) =>
        account.name.toLowerCase().includes(term) ||
        account.site_url.toLowerCase().includes(term) ||
        account.username?.toLowerCase().includes(term)
    )
  }, [accounts, searchTerm])

  const handleRefresh = async (id: string) => {
    try {
      await api.refreshAccount(id)
      toast.success("刷新成功")
      await loadAccounts()
    } catch (err: any) {
      toast.error(err.response?.data?.error || "刷新失败")
    }
  }

  const handleEdit = (id: string) => {
    setEditingAccountId(id)
    setIsAddDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    const account = accounts.find((acc) => acc.id === id)
    if (account) {
      setDeletingAccount(account)
    }
  }

  const confirmDelete = async () => {
    if (!deletingAccount) return
    setIsDeleting(true)
    try {
      await api.deleteAccount(deletingAccount.id)
      toast.success("删除成功")
      await loadAccounts()
      setDeletingAccount(null)
    } catch (err: any) {
      toast.error(err.response?.data?.error || "删除失败")
    } finally {
      setIsDeleting(false)
    }
  }

  // 处理拖拽结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    // 只在非搜索状态下允许拖拽排序
    if (searchTerm) {
      return
    }

    const oldIndex = accounts.findIndex((account: DisplaySiteData) => account.id === active.id)
    const newIndex = accounts.findIndex((account: DisplaySiteData) => account.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // 更新本地状态（乐观更新）
    const newAccounts = arrayMove(accounts, oldIndex, newIndex)
    setAccounts(newAccounts)

    // 保存排序到后端
    try {
      const accountIds = newAccounts.map((account: DisplaySiteData) => account.id)
      await api.updateAccountSorting(accountIds)
      // 不显示成功提示，避免打扰用户
    } catch (err: any) {
      // 如果保存失败，恢复原顺序
      setAccounts(accounts)
      toast.error(err.response?.data?.error || "保存排序失败")
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            账号管理 <span className="text-base font-normal text-gray-600 dark:text-gray-400">(管理您的 AI 聚合中转站账号)</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAutoRefreshDialogOpen(true)}
            disabled={accounts.length === 0}
          >
            自动刷新设置
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                toast.loading("正在检测所有账号...", { id: "refresh-all" })
                const refreshPromises = accounts.map((account) =>
                  api.refreshAccount(account.id).catch((err) => {
                    console.error(`Failed to refresh account ${account.id}:`, err)
                    return null
                  })
                )
                await Promise.all(refreshPromises)
                await loadAccounts()
                toast.success("所有账号检测完成", { id: "refresh-all" })
              } catch (err: any) {
                toast.error(err.response?.data?.error || "检测失败", { id: "refresh-all" })
              }
            }}
            disabled={accounts.length === 0}
          >
            一键检测
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>添加账号</Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mb-4">
        <AccountSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索账号名称、URL 或用户名..."
        />
      </div>

      {filteredAccounts.length === 0 ? (
        <EmptyState
          title={searchTerm ? "未找到匹配的账号" : "暂无账号"}
          description={
            searchTerm
              ? "尝试使用其他关键词搜索"
              : "点击上方按钮添加您的第一个账号"
          }
          action={
            !searchTerm && (
              <Button onClick={() => setIsAddDialogOpen(true)}>添加账号</Button>
            )
          }
        />
      ) : searchTerm ? (
        // 搜索状态下不使用拖拽，直接显示
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 md:gap-6">
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onRefresh={handleRefresh}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        // 非搜索状态下启用拖拽排序
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={accounts.map((acc: DisplaySiteData) => acc.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 md:gap-6">
              {accounts.map((account) => (
                <SortableAccountCard
                  key={account.id}
                  account={account}
                  onRefresh={handleRefresh}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AccountDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false)
          setEditingAccountId(undefined)
        }}
        onSuccess={loadAccounts}
        accountId={editingAccountId}
      />

      <DeleteAccountDialog
        isOpen={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        onConfirm={confirmDelete}
        account={deletingAccount}
        isLoading={isDeleting}
      />

      <AutoRefreshDialog
        isOpen={isAutoRefreshDialogOpen}
        onClose={() => setIsAutoRefreshDialogOpen(false)}
        accounts={accounts}
        onSuccess={loadAccounts}
      />
    </div>
  )
}

