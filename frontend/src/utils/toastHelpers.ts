/**
 * Toast 提示工具函数
 */
import toast from "react-hot-toast"

export const toastHelpers = {
  success: (message: string) => {
    toast.success(message)
  },
  error: (message: string) => {
    toast.error(message)
  },
  loading: (message: string) => {
    return toast.loading(message)
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    }
  ) => {
    return toast.promise(promise, messages)
  }
}

