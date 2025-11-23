import { Select } from "../../../components/ui"
import type { DisplaySiteData } from "../../../types"

interface AccountSelectorProps {
  accounts: DisplaySiteData[]
  selectedAccountId: string | null
  onSelect: (accountId: string | null) => void
}

export function AccountSelector({
  accounts,
  selectedAccountId,
  onSelect
}: AccountSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        选择账号
      </label>
      <Select
        value={selectedAccountId || ""}
        onChange={(e) => onSelect(e.target.value || null)}
      >
        <option value="">选择账号</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </Select>
    </div>
  )
}

