import { HTMLAttributes, forwardRef } from "react"
import { cn } from "../../utils/cn"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive"
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-white dark:bg-gray-800",
          "border-gray-200 dark:border-gray-700",
          variant === "interactive" && "transition-shadow hover:shadow-md",
          className
        )}
        {...props}
      />
    )
  }
)

Card.displayName = "Card"

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("p-6", className)} {...props} />
  }
)

CardContent.displayName = "CardContent"

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("p-6 pb-4", className)} {...props} />
  }
)

CardHeader.displayName = "CardHeader"

