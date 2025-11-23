import { ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "../../utils/cn"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          {
            // Variants
            "bg-blue-600 text-white hover:bg-blue-700": variant === "default",
            "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600":
              variant === "secondary",
            "border border-gray-300 bg-transparent hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800":
              variant === "outline",
            "hover:bg-gray-100 dark:hover:bg-gray-800": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700": variant === "danger",
            // Sizes
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-base": size === "md",
            "h-12 px-6 text-lg": size === "lg"
          },
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

