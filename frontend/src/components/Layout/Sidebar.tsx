import { Link, useLocation } from "react-router-dom"
import { cn } from "../../utils/cn"
import { useSidebarStore } from "../../store/sidebarStore"

interface MenuItem {
  id: string
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

// 图标组件
const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const KeyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
)

const CubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const DatabaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
)

const menuItems: MenuItem[] = [
  { id: "account", name: "账户管理", path: "/accounts", icon: UserIcon },
  { id: "keys", name: "密钥管理", path: "/keys", icon: KeyIcon },
  { id: "models", name: "模型列表", path: "/models", icon: CubeIcon },
  { id: "data-backup", name: "数据备份", path: "/data-backup", icon: DatabaseIcon },
  { id: "auto-checkin", name: "自动签到", path: "/auto-checkin", icon: CalendarIcon }
]

export function Sidebar() {
  const location = useLocation()
  const { isExpanded, setExpanded } = useSidebarStore()

  return (
    <>
      {/* 移动端遮罩层 */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden",
          isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setExpanded(false)}
      />

      {/* 侧边栏 */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 ease-in-out overflow-y-auto",
          isExpanded
            ? "translate-x-0 w-64"
            : "-translate-x-full lg:translate-x-0 lg:w-20"
        )}
      >
        <div className="p-4 lg:p-6">
          <h1
            className={cn(
              "text-xl font-bold text-gray-900 dark:text-white mb-8 transition-all duration-300",
              !isExpanded && "lg:text-sm lg:mb-4 lg:truncate lg:text-center"
            )}
          >
            {isExpanded ? "WEB API HUB" : "HUB"}
          </h1>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path
              const IconComponent = item.icon
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => {
                    // 移动端点击菜单项后关闭侧边栏
                    if (window.innerWidth < 1024) {
                      setExpanded(false)
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors group",
                    isActive
                      ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                    !isExpanded && "lg:justify-center lg:px-2"
                  )}
                  title={!isExpanded ? item.name : undefined}
                >
                  <IconComponent
                    className={cn(
                      "h-5 w-5 shrink-0 transition-all duration-300",
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    )}
                  />
                  <span
                    className={cn(
                      "transition-all duration-300",
                      !isExpanded && "lg:hidden"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
