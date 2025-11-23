/**
 * 合并 className 的工具函数
 */
export function cn(...classes: (string | undefined | null | false | Record<string, boolean>)[]): string {
  return classes
    .filter(Boolean)
    .map((cls) => {
      if (typeof cls === "string") return cls
      if (typeof cls === "object" && cls !== null) {
        return Object.entries(cls)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(" ")
      }
      return ""
    })
    .filter(Boolean)
    .join(" ")
}

