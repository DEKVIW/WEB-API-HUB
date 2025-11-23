/**
 * 模型厂商识别和图标映射工具
 * 使用官方图标设计
 */

import React from "react"

export interface ProviderConfig {
  name: string
  icon: React.ComponentType<{ className?: string }>
  patterns: RegExp[]
  color: string
  bgColor: string
}

// OpenAI 官方图标 (GPT)
const OpenAIIcon = ({ className }: { className?: string }) => {
  return React.createElement('svg', { 
    className: className || 'w-5 h-5', 
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg'
  },
    React.createElement('path', { 
      d: 'M22.282 9.821a5.985 5.985 0 0 0-.516-1.9l.89-.89a.75.75 0 0 0-1.06-1.06l-.89.89a5.985 5.985 0 0 0-1.9-.516V5.75a.75.75 0 0 0-1.5 0v.695a5.985 5.985 0 0 0-1.9.516l-.89-.89a.75.75 0 0 0-1.06 1.06l.89.89a5.985 5.985 0 0 0-.516 1.9H5.75a.75.75 0 0 0 0 1.5h.695a5.985 5.985 0 0 0 .516 1.9l-.89.89a.75.75 0 1 0 1.06 1.06l.89-.89a5.985 5.985 0 0 0 1.9.516v.695a.75.75 0 0 0 1.5 0v-.695a5.985 5.985 0 0 0 1.9-.516l.89.89a.75.75 0 1 0 1.06-1.06l-.89-.89a5.985 5.985 0 0 0 .516-1.9h.695a.75.75 0 0 0 0-1.5h-.695ZM12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z',
      fill: 'currentColor'
    })
  )
}

// Anthropic Claude 官方图标
const ClaudeIcon = ({ className }: { className?: string }) => {
  return React.createElement('svg', { 
    className: className || 'w-5 h-5', 
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg'
  },
    React.createElement('path', { 
      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z',
      fill: 'currentColor'
    })
  )
}

// Google Gemini 官方图标
const GeminiIcon = ({ className }: { className?: string }) => {
  return React.createElement('svg', { 
    className: className || 'w-5 h-5', 
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg'
  },
    React.createElement('path', { 
      d: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      fill: 'none'
    })
  )
}

// Grok (xAI) 官方图标
const GrokIcon = ({ className }: { className?: string }) => {
  return React.createElement('svg', { 
    className: className || 'w-5 h-5', 
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    xmlns: 'http://www.w3.org/2000/svg'
  },
    React.createElement('path', { 
      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      fill: 'currentColor'
    })
  )
}

// 阿里通义千问 (Qwen) 图标
const QwenIcon = ({ className }: { className?: string }) => {
  return React.createElement('svg', { 
    className: className || 'w-5 h-5', 
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    xmlns: 'http://www.w3.org/2000/svg'
  },
    React.createElement('path', { 
      d: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      fill: 'currentColor'
    })
  )
}

// DeepSeek 图标
const DeepSeekIcon = ({ className }: { className?: string }) => {
  return React.createElement('svg', { 
    className: className || 'w-5 h-5', 
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    xmlns: 'http://www.w3.org/2000/svg'
  },
    React.createElement('path', { 
      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
      fill: 'currentColor'
    })
  )
}

// Mistral AI 图标
const MistralIcon = ({ className }: { className?: string }) => {
  return React.createElement('svg', { 
    className: className || 'w-5 h-5', 
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    xmlns: 'http://www.w3.org/2000/svg'
  },
    React.createElement('path', { 
      d: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      fill: 'currentColor'
    })
  )
}

// Moonshot (Kimi) 图标
const MoonshotIcon = ({ className }: { className?: string }) => {
  return React.createElement('svg', { 
    className: className || 'w-5 h-5', 
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg'
  },
    React.createElement('circle', { 
      cx: '12', 
      cy: '12', 
      r: '10',
      stroke: 'currentColor',
      strokeWidth: '2',
      fill: 'none'
    }),
    React.createElement('path', { 
      d: 'M12 6v6l4 2',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round'
    })
  )
}

// 默认图标
const DefaultIcon = ({ className }: { className?: string }) => {
  return React.createElement('svg', { 
    className: className || 'w-5 h-5', 
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    xmlns: 'http://www.w3.org/2000/svg'
  },
    React.createElement('path', { 
      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
      fill: 'currentColor'
    })
  )
}

// 厂商配置映射
export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  OpenAI: {
    name: "OpenAI",
    icon: OpenAIIcon,
    patterns: [
      /gpt|whisper/i,
      /o\d+/i, // o1, o3 等
      /text-embedding/i
    ],
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20"
  },
  Claude: {
    name: "Claude",
    icon: ClaudeIcon,
    patterns: [/claude/i, /sonnet/i, /haiku/i, /neptune/i, /opus/i],
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20"
  },
  Gemini: {
    name: "Gemini",
    icon: GeminiIcon,
    patterns: [/gemini/i],
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20"
  },
  Grok: {
    name: "Grok",
    icon: GrokIcon,
    patterns: [/grok/i],
    color: "text-gray-900 dark:text-gray-100",
    bgColor: "bg-gray-50 dark:bg-gray-800"
  },
  Qwen: {
    name: "阿里",
    icon: QwenIcon,
    patterns: [/qwen/i],
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/20"
  },
  DeepSeek: {
    name: "DeepSeek",
    icon: DeepSeekIcon,
    patterns: [/deepseek/i],
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-900/20"
  },
  Mistral: {
    name: "Mistral",
    icon: MistralIcon,
    patterns: [
      /mistral|magistral|mixtral|codestral|pixtral|devstral|Voxtral|ministral/i
    ],
    color: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20"
  },
  Moonshot: {
    name: "Moonshot",
    icon: MoonshotIcon,
    patterns: [/moonshot|kimi/i],
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20"
  },
  Unknown: {
    name: "Unknown",
    icon: DefaultIcon,
    patterns: [],
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-800"
  }
}

/**
 * 根据模型名称识别厂商
 */
export const identifyProvider = (modelName: string): string => {
  for (const [providerType, config] of Object.entries(PROVIDER_CONFIGS)) {
    if (providerType === "Unknown") continue

    for (const pattern of config.patterns) {
      if (pattern.test(modelName)) {
        return providerType
      }
    }
  }

  return "Unknown"
}

/**
 * 获取厂商配置
 */
export const getProviderConfig = (modelName: string): ProviderConfig => {
  const providerType = identifyProvider(modelName)
  return PROVIDER_CONFIGS[providerType] || PROVIDER_CONFIGS.Unknown
}
