/**
 * 模型相关类型定义
 */

export interface ModelPricing {
  model_name: string
  model_description?: string
  quota_type: number // 0: 按量计费, 1: 按次计费
  input_price: number
  output_price: number
  model_ratio: number
  completion_ratio?: number // 完成比例（用于按量计费计算）
  enable_groups: string[]
  endpoint_types?: string[]
}

export interface ModelPricingData {
  data: ModelPricing[]
  group_ratio?: Record<string, number>
}

export interface CalculatedPrice {
  inputPrice: number
  outputPrice: number
  perCallPrice?: number
  inputPriceCNY: number
  outputPriceCNY: number
  perCallPriceCNY?: number
}

export type ProviderType = "openai" | "anthropic" | "google" | "meta" | "other"

