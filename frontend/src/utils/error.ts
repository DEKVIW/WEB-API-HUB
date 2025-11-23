/**
 * 错误处理工具函数
 */

export function getErrorMessage(error: any): string {
  if (error?.response?.data?.error) {
    return error.response.data.error
  }
  if (error?.message) {
    return error.message
  }
  return "操作失败，请稍后重试"
}

export function handleApiError(error: any, defaultMessage = "操作失败"): string {
  const message = getErrorMessage(error)
  console.error("API Error:", error)
  return message || defaultMessage
}

