import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * 账号存储服务
 * 替代原扩展的 localStorage/chrome.storage
 */
export class AccountStorageService {
  /**
   * 获取用户的所有账号
   */
  async getAllAccounts(userId: string, sorted: boolean = false) {
    const accounts = await prisma.account.findMany({
      where: { userId },
      include: {
        tokens: true,
        groups: true
      }
    })

    if (sorted) {
      // 按置顶和排序优先级排序
      return accounts.sort((a, b) => {
        // 置顶的在前
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        
        // 然后按排序优先级
        const orderA = a.sortOrder || 0
        const orderB = b.sortOrder || 0
        if (orderA !== orderB) return orderB - orderA
        
        // 最后按创建时间
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
    }

    return accounts
  }

  /**
   * 根据 ID 获取账号
   */
  async getAccountById(accountId: string, userId: string) {
    return await prisma.account.findFirst({
      where: {
        id: accountId,
        userId // 确保只能访问自己的账号
      },
      include: {
        tokens: true,
        groups: true
      }
    })
  }

  /**
   * 创建账号
   */
  async createAccount(userId: string, accountData: any) {
    const { tokens, groups, ...accountFields } = accountData

    const account = await prisma.account.create({
      data: {
        ...accountFields,
        userId
      },
      include: {
        tokens: true,
        groups: true
      }
    })

    // 如果有 tokens，创建它们
    if (tokens && Array.isArray(tokens)) {
      await Promise.all(
        tokens.map((token: any) =>
          prisma.apiToken.create({
            data: {
              ...token,
              accountId: account.id
            }
          })
        )
      )
    }

    // 如果有 groups，创建它们
    if (groups && Array.isArray(groups)) {
      await Promise.all(
        groups.map((group: any) =>
          prisma.accountGroup.create({
            data: {
              ...group,
              accountId: account.id
            }
          })
        )
      )
    }

    return await this.getAccountById(account.id, userId)
  }

  /**
   * 更新账号
   */
  async updateAccount(
    accountId: string,
    userId: string,
    accountData: any
  ) {
    // 确保账号属于当前用户
    const existing = await this.getAccountById(accountId, userId)
    if (!existing) {
      throw new Error("Account not found")
    }

    const { tokens, groups, ...accountFields } = accountData

    const account = await prisma.account.update({
      where: { id: accountId },
      data: accountFields,
      include: {
        tokens: true,
        groups: true
      }
    })

    return account
  }

  /**
   * 删除账号
   */
  async deleteAccount(accountId: string, userId: string) {
    // 确保账号属于当前用户
    const existing = await this.getAccountById(accountId, userId)
    if (!existing) {
      throw new Error("Account not found")
    }

    // Prisma 会自动级联删除关联的 tokens 和 groups
    await prisma.account.delete({
      where: { id: accountId }
    })

    return { success: true }
  }

  /**
   * 更新账号余额等信息
   */
  async updateAccountBalance(
    accountId: string,
    userId: string,
    balanceData: {
      quota?: number
      usedQuota?: number
      todayPromptTokens?: number
      todayCompletionTokens?: number
      todayQuotaConsumption?: number
      todayRequestsCount?: number
      todayIncome?: number
      healthStatus?: string
      healthReason?: string
      lastSyncTime?: bigint
      checkInConfig?: string | any  // SQLite 中存储为 JSON 字符串
    }
  ) {
    return await prisma.account.update({
      where: { id: accountId },
      data: balanceData,
      include: {
        tokens: true,
        groups: true
      }
    })
  }

  /**
   * 获取账号统计信息
   */
  async getAccountStats(userId: string) {
    const accounts = await this.getAllAccounts(userId)

    return accounts.reduce(
      (stats, account) => ({
        total_quota: stats.total_quota + (account.quota || 0),
        today_total_consumption:
          stats.today_total_consumption + (account.todayQuotaConsumption || 0),
        today_total_requests:
          stats.today_total_requests + (account.todayRequestsCount || 0),
        today_total_prompt_tokens:
          stats.today_total_prompt_tokens + (account.todayPromptTokens || 0),
        today_total_completion_tokens:
          stats.today_total_completion_tokens +
          (account.todayCompletionTokens || 0),
        today_total_income: stats.today_total_income + (account.todayIncome || 0)
      }),
      {
        total_quota: 0,
        today_total_consumption: 0,
        today_total_requests: 0,
        today_total_prompt_tokens: 0,
        today_total_completion_tokens: 0,
        today_total_income: 0
      }
    )
  }

  /**
   * 删除用户的所有账号
   */
  async deleteAllAccounts(userId: string) {
    await prisma.account.deleteMany({
      where: { userId }
    })
  }
}

export const accountStorageService = new AccountStorageService()

