/**
 * 类型定义
 * 对应原插件中的类型
 */

export enum AuthTypeEnum {
  AccessToken = "AccessToken",
  Cookie = "Cookie",
  None = "None"
}

export enum SiteHealthStatus {
  Healthy = "healthy",
  Warning = "warning",
  Error = "error",
  Unknown = "unknown"
}

export interface CheckInConfig {
  enableDetection: boolean
  autoCheckInEnabled?: boolean
  isCheckedInToday?: boolean
  customCheckInUrl?: string
  customRedeemUrl?: string
  lastCheckInDate?: string
  openRedeemWithCheckIn?: boolean
}

export interface HealthStatus {
  status: SiteHealthStatus
  reason?: string
}

