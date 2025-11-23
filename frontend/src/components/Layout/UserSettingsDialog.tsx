import { useState, useEffect } from "react"
import { useAuthStore } from "../../store/authStore"
import { api } from "../../services/api"
import toast from "react-hot-toast"

interface UserSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function UserSettingsDialog({ isOpen, onClose }: UserSettingsDialogProps) {
  const { user } = useAuthStore()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
    }
  }, [isOpen, user])

  if (!isOpen) return null

  const handleSave = async () => {
    try {
      // 更新基本信息
      const updateData: { username?: string; email?: string } = {}
      if (formData.username && formData.username !== user?.username) {
        updateData.username = formData.username
      }
      if (formData.email && formData.email !== user?.email) {
        updateData.email = formData.email
      }

      if (Object.keys(updateData).length > 0) {
        await api.updateUserProfile(updateData)
      }

      // 更新密码（如果填写了密码字段）
      if (formData.currentPassword && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error("新密码与确认密码不匹配")
          return
        }

        if (formData.newPassword.length < 6) {
          toast.error("密码长度至少6位")
          return
        }

        await api.changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
        setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" })
      }

      if (Object.keys(updateData).length === 0 && !formData.currentPassword && !formData.newPassword) {
        toast("没有需要更新的信息")
        return
      }

      toast.success("保存成功")
      if (Object.keys(updateData).length > 0) {
        window.location.reload()
      } else {
        onClose()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "保存失败")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">用户设置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              用户名
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              邮箱
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              当前密码（修改密码时填写）
            </label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              placeholder="留空则不修改密码"
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              新密码（修改密码时填写）
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="留空则不修改密码"
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              确认密码
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="修改密码时填写"
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

