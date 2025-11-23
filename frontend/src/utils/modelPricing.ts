/**
 * 模型价格计算工具
 */

import type { ModelPricing, CalculatedPrice } from "../types/models"

/**
 * 计算模型价格
 * 与插件版保持一致的计算逻辑
 * 插件版公式：inputUSD = model_ratio × 2 × groupRatio（不需要除以 CONVERSION_FACTOR）
 */
export function calculateModelPrice(
  model: ModelPricing,
  groupRatio: Record<string, number>,
  exchangeRate: number,
  userGroup: string = "default"
): CalculatedPrice {
  const ratio = groupRatio[userGroup] || groupRatio["default"] || 1

  // 按量计费
  if (model.quota_type === 0) {
    // 插件版的计算方式：使用 model_ratio 和 completion_ratio
    // inputUSD（每 1M token） = model_ratio × 2 × groupRatio
    // outputUSD（每 1M token） = model_ratio × completion_ratio × 2 × groupRatio
    const modelRatio = model.model_ratio || 1
    // 从后端传递的 completion_ratio 字段获取，如果没有则从 input_price/output_price 计算
    let completionRatio = 1
    if (model.completion_ratio !== undefined) {
      completionRatio = model.completion_ratio
    } else if (model.input_price && model.output_price && model.input_price > 0) {
      completionRatio = model.output_price / model.input_price
    }
    
    // 注意：插件版不需要除以 CONVERSION_FACTOR，直接使用 model_ratio × 2 × ratio
    const inputPrice = modelRatio * 2 * ratio
    const outputPrice = modelRatio * completionRatio * 2 * ratio

    return {
      inputPrice,
      outputPrice,
      inputPriceCNY: inputPrice * exchangeRate,
      outputPriceCNY: outputPrice * exchangeRate
    }
  }

  // 按次计费
  // 插件版逻辑：如果 model_price 是数字，直接使用 cost * factor（不需要除以 CONVERSION_FACTOR）
  // 后端已经将 model_price 转换为 input_price，所以直接使用 input_price * ratio
  // 注意：按次计费的价格单位已经是美元，不需要除以 CONVERSION_FACTOR
  const perCallPrice = model.input_price ? model.input_price * ratio : 0
  return {
    inputPrice: 0,
    outputPrice: 0,
    perCallPrice,
    inputPriceCNY: 0,
    outputPriceCNY: 0,
    perCallPriceCNY: perCallPrice * exchangeRate
  }
}

/**
 * 格式化价格显示
 */
export function formatPrice(price: number, currency: "USD" | "CNY" = "USD"): string {
  const symbol = currency === "USD" ? "$" : "¥"
  if (price === 0) return "免费"
  if (price < 0.0001) return `${symbol}${price.toExponential(2)}`
  return `${symbol}${price.toFixed(4)}`
}

/**
 * 格式化紧凑价格
 * 避免科学计数法，使用固定小数位显示
 */
export function formatPriceCompact(price: number, currency: "USD" | "CNY" = "USD"): string {
  const symbol = currency === "USD" ? "$" : "¥"
  if (price === 0) return `${symbol}0.00`
  
  // 对于非常小的价格，使用固定小数位而不是科学计数法
  if (price < 0.0001) {
    // 显示6位小数，避免科学计数法
    return `${symbol}${price.toFixed(6)}`
  }
  
  if (price < 1) {
    // 小于1的价格显示4位小数
    return `${symbol}${price.toFixed(4)}`
  }
  
  // 大于等于1的价格显示2位小数
  return `${symbol}${price.toFixed(2)}`
}

/**
 * 判断是否为按量计费
 */
export function isTokenBillingType(quotaType: number): boolean {
  return quotaType === 0
}

