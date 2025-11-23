import { HTMLAttributes } from "react"
import { cn } from "../../utils/cn"

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "info"
}

export function Alert({ className, variant = "default", children, ...props }: AlertProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        {
          "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200":
            variant === "default" || variant === "info",
          "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200":
            variant === "success",
          "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200":
            variant === "warning",
          "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200":
            variant === "error"
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

