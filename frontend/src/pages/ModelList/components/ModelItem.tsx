import { useState, MouseEvent } from "react"
import { Card, CardContent, Badge } from "../../../components/ui"
import {
  formatPriceCompact,
  isTokenBillingType
} from "../../../utils/modelPricing"
import { getProviderConfig } from "../../../utils/modelProviders"
import type { ModelPricing, CalculatedPrice } from "../../../types/models"
import toast from "react-hot-toast"
// 简单的复制图标组件（如果不想安装 @heroicons/react）
const DocumentDuplicateIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

interface ModelItemProps {
  model: ModelPricing
  calculatedPrice: CalculatedPrice
  exchangeRate: number
  showRealPrice: boolean
  showRatioColumn: boolean
  userGroup: string
  isAllGroupsMode?: boolean
}

export function ModelItem({
  model,
  calculatedPrice,
  exchangeRate: _exchangeRate, // 保留接口兼容性，按次计费始终显示美元
  showRealPrice,
  showRatioColumn,
  userGroup,
  isAllGroupsMode = false
}: ModelItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const tokenBillingType = isTokenBillingType(model.quota_type)
  
  // 修复可用性检测逻辑：与插件版保持一致
  const isAvailableForUser = isAllGroupsMode
    ? model.enable_groups.length > 0 // 所有分组模式：任何一个用户分组可用即可
    : model.enable_groups.includes(userGroup) // 特定分组模式：必须该分组可用
  
  const providerConfig = getProviderConfig(model.model_name)
  const IconComponent = providerConfig.icon

  const handleCopyModelName = async () => {
    const textToCopy = model.model_name
    
    // 检查是否支持 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy)
        toast.success("已复制模型名称")
        return
      } catch (error) {
        console.error("Clipboard API 失败:", error)
        // 降级到传统方法
      }
    }
    
    // 降级方案：使用 document.execCommand
    try {
      const textArea = document.createElement("textarea")
      textArea.value = textToCopy
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand("copy")
      document.body.removeChild(textArea)
      
      if (successful) {
        toast.success("已复制模型名称")
      } else {
        throw new Error("execCommand 失败")
      }
    } catch (error) {
      console.error("复制失败:", error)
      // 最后的降级方案：提示用户手动复制
      toast.error(`复制失败，请手动复制: ${textToCopy}`, {
        duration: 5000
      })
    }
  }

  return (
    <Card
      variant="interactive"
      className={`group hover:shadow-lg transition-all duration-300 min-w-[280px] ${
        isAvailableForUser
          ? "hover:border-blue-300 dark:hover:border-blue-500/50"
          : "bg-gray-50 opacity-75 dark:bg-gray-800/50"
      }`}
    >
      <CardContent className="p-4 md:p-5 lg:p-6">
        {/* 头部区域 - 图标、标题和可用性在一行 */}
        <div className="flex items-center gap-2 mb-3 flex-nowrap">
          {/* 厂商图标 */}
          <div className={`shrink-0 rounded-lg p-1.5 ${providerConfig.bgColor}`}>
            <IconComponent className={`h-5 w-5 ${providerConfig.color}`} />
          </div>
          
          {/* 模型名称 - 可省略 */}
          <h3
            className={`flex-1 min-w-0 text-base font-bold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 truncate ${
              isAvailableForUser
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              handleCopyModelName()
            }}
            title={model.model_name}
          >
            {model.model_name}
          </h3>
          
          {/* 复制按钮 */}
          <button
            type="button"
            onClick={(e: MouseEvent) => {
              e.stopPropagation()
              handleCopyModelName()
            }}
            className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
            title="复制模型名称"
            aria-label="复制模型名称"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
          
          {/* 标签 - 计费模式和可用状态 */}
          <div className="flex shrink-0 items-center gap-1.5">
            {/* 计费模式标签 */}
            <Badge variant={tokenBillingType ? "info" : "default"} className="text-xs whitespace-nowrap">
              {tokenBillingType ? "按量" : "按次"}
            </Badge>
            
            {/* 可用状态标签 */}
            <Badge variant={isAvailableForUser ? "success" : "error"} className="text-xs whitespace-nowrap">
              {isAvailableForUser ? "可用" : "不可用"}
            </Badge>
          </div>
          
          {/* 展开/收起按钮 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
          >
            {isExpanded ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
        
        {/* 模型描述 */}
        {model.model_description && (
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {model.model_description}
          </p>
        )}

        {/* 价格信息 */}
        <div className="mt-3 space-y-2">
          {tokenBillingType ? (
            // 按量计费
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-2 md:p-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">输入</span>
                <p className="text-sm md:text-base font-bold text-blue-600 dark:text-blue-400">
                  {showRealPrice
                    ? formatPriceCompact(calculatedPrice.inputPrice, "USD")
                    : formatPriceCompact(calculatedPrice.inputPriceCNY, "CNY")}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-2 md:p-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">输出</span>
                <p className="text-sm md:text-base font-bold text-green-600 dark:text-green-400">
                  {showRealPrice
                    ? formatPriceCompact(calculatedPrice.outputPrice, "USD")
                    : formatPriceCompact(calculatedPrice.outputPriceCNY, "CNY")}
                </p>
              </div>
              {showRatioColumn && (
                <div className="col-span-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">倍率: </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {model.model_ratio}x
                  </span>
                </div>
              )}
            </div>
          ) : (
            // 按次计费
            calculatedPrice.perCallPrice !== undefined && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-2 md:p-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">每次调用</span>
                <p className={`text-sm md:text-base font-bold ${
                  isAvailableForUser ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400"
                }`}>
                  {formatPriceCompact(calculatedPrice.perCallPrice || 0, "USD")}
                </p>
              </div>
            )
          )}
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">可用分组: </span>
              <span className="text-gray-900 dark:text-white font-medium">
                {model.enable_groups.join(", ") || "无"}
              </span>
            </div>
            {model.endpoint_types && model.endpoint_types.length > 0 && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">端点类型: </span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {model.endpoint_types.join(", ")}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

