import { Select, Label, Switch } from "../../../components/ui"
import { AccountSearchInput } from "../../AccountManagement/components/AccountSearchInput"

interface ControlPanelProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedGroup: string
  onGroupChange: (value: string) => void
  availableGroups: string[]
  showRealPrice: boolean
  onShowRealPriceChange: (value: boolean) => void
  showRatioColumn: boolean
  onShowRatioColumnChange: (value: boolean) => void
  isLoading: boolean
}

export function ControlPanel({
  searchTerm,
  onSearchChange,
  selectedGroup,
  onGroupChange,
  availableGroups,
  showRealPrice,
  onShowRealPriceChange,
  showRatioColumn,
  onShowRatioColumnChange,
  isLoading
}: ControlPanelProps) {
  return (
    <div className="space-y-4 mb-6">
      <AccountSearchInput
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="搜索模型名称或描述..."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <Label htmlFor="group" className="mb-2">分组筛选</Label>
          <Select
            id="group"
            value={selectedGroup}
            onChange={(e) => onGroupChange(e.target.value)}
            disabled={isLoading}
          >
            <option value="all">所有分组</option>
            {availableGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col">
          <Label className="mb-2">显示真实价格</Label>
          <div className="flex items-center h-10">
            <Switch
              checked={showRealPrice}
              onCheckedChange={onShowRealPriceChange}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <Label className="mb-2">显示倍率</Label>
          <div className="flex items-center h-10">
            <Switch
              checked={showRatioColumn}
              onCheckedChange={onShowRatioColumnChange}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

