import { Input } from "../../../components/ui/Input"

interface AccountSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function AccountSearchInput({
  value,
  onChange,
  placeholder = "搜索账号..."
}: AccountSearchInputProps) {
  return (
    <div className="relative">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  )
}

