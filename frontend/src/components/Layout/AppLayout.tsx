import { ReactNode } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { useSidebarStore } from "../../store/sidebarStore"
import { cn } from "../../utils/cn"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isExpanded } = useSidebarStore()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          isExpanded ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

