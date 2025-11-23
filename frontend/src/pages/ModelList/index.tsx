import { useEffect, useState, useMemo } from "react"
import { api } from "../../services/api"
import { EmptyState } from "../../components/ui"
import { AccountSelector } from "./components/AccountSelector"
import { ControlPanel } from "./components/ControlPanel"
import { ModelItem } from "./components/ModelItem"
import { calculateModelPrice } from "../../utils/modelPricing"
import type { DisplaySiteData } from "../../types"
import type { ModelPricingData } from "../../types/models"
import toast from "react-hot-toast"

export default function ModelList() {
  const [accounts, setAccounts] = useState<DisplaySiteData[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [pricingData, setPricingData] = useState<ModelPricingData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("all")
  const [showRealPrice, setShowRealPrice] = useState(false)
  const [showRatioColumn, setShowRatioColumn] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (selectedAccountId) {
      loadPricingData()
    } else {
      setPricingData(null)
    }
  }, [selectedAccountId])

  const loadAccounts = async () => {
    try {
      const response = await api.getAccounts(true)
      setAccounts(response.data.data)
      if (response.data.data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(response.data.data[0].id)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "加载账号失败")
    }
  }

  const loadPricingData = async () => {
    if (!selectedAccountId) return
    setIsLoading(true)
    try {
      const response = await api.getModelPricing(selectedAccountId)
      setPricingData(response.data.data)
    } catch (error: any) {
      toast.error(error.response?.data?.error || "加载模型价格失败")
      setPricingData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedAccount = useMemo(
    () => accounts.find((acc) => acc.id === selectedAccountId),
    [accounts, selectedAccountId]
  )

  const exchangeRate = useMemo(() => {
    if (!selectedAccount || selectedAccount.balance.USD === 0) {
      return 7.0 // 默认汇率
    }
    return selectedAccount.balance.CNY / selectedAccount.balance.USD
  }, [selectedAccount])

  const availableGroups = useMemo(() => {
    if (!pricingData?.group_ratio) return []
    return Object.keys(pricingData.group_ratio).filter((key) => key !== "")
  }, [pricingData])

  const modelsWithPricing = useMemo(() => {
    if (!pricingData || !selectedAccount || !Array.isArray(pricingData.data)) {
      return []
    }

    return pricingData.data.map((model) => {
      const calculatedPrice = calculateModelPrice(
        model,
        pricingData.group_ratio || {},
        exchangeRate,
        selectedGroup === "all" ? "default" : selectedGroup
      )

      return {
        model,
        calculatedPrice
      }
    })
  }, [pricingData, selectedAccount, exchangeRate, selectedGroup])

  const filteredModels = useMemo(() => {
    let filtered = modelsWithPricing

    // 分组筛选
    if (selectedGroup !== "all" && availableGroups.includes(selectedGroup)) {
      filtered = filtered.filter((item) =>
        item.model.enable_groups.includes(selectedGroup)
      )
    }

    // 搜索筛选
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.model.model_name.toLowerCase().includes(term) ||
          item.model.model_description?.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [modelsWithPricing, selectedGroup, searchTerm, availableGroups])

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          模型列表 <span className="text-base font-normal text-gray-600 dark:text-gray-400">(查看账号支持的模型和价格信息)</span>
        </h1>
      </div>

      <div className="mb-6">
        <AccountSelector
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelect={setSelectedAccountId}
        />
      </div>

      {selectedAccountId && (
        <>
          <ControlPanel
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedGroup={selectedGroup}
            onGroupChange={setSelectedGroup}
            availableGroups={availableGroups}
            showRealPrice={showRealPrice}
            onShowRealPriceChange={setShowRealPrice}
            showRatioColumn={showRatioColumn}
            onShowRatioColumnChange={setShowRatioColumn}
            isLoading={isLoading}
          />

          {isLoading ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              加载中...
            </div>
          ) : filteredModels.length === 0 ? (
            <EmptyState
              title={searchTerm ? "未找到匹配的模型" : "暂无模型"}
              description={
                searchTerm
                  ? "尝试使用其他关键词搜索"
                  : "该账号暂无可用模型或加载失败"
              }
            />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 md:gap-6 max-h-[70vh] overflow-y-auto">
              {filteredModels.map((item, index) => (
                <ModelItem
                  key={`${item.model.model_name}-${index}`}
                  model={item.model}
                  calculatedPrice={item.calculatedPrice}
                  exchangeRate={exchangeRate}
                  showRealPrice={showRealPrice}
                  showRatioColumn={showRatioColumn}
                  userGroup={selectedGroup === "all" ? "default" : selectedGroup}
                  isAllGroupsMode={selectedGroup === "all"}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!selectedAccountId && (
        <EmptyState
          title="请选择账号"
          description="从上方下拉菜单中选择一个账号以查看其模型列表"
        />
      )}
    </div>
  )
}

