import { HTMLAttributes, forwardRef } from "react"
import { cn } from "../../utils/cn"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info"
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          {
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300":
              variant === "default",
            "bg-green-600 text-white dark:bg-green-600 dark:text-white":
              variant === "success", // 绿底白字
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300":
              variant === "warning",
            "bg-red-600 text-white dark:bg-red-600 dark:text-white":
              variant === "error", // 红底白字
            "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300":
              variant === "info"
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = "Badge"

