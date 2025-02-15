"use client"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}

export function MultiSelect({ options, selected, onChange, placeholder = "Select options..." }: MultiSelectProps) {
  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleRemove = (valueToRemove: string) => {
    onChange(selected.filter((value) => value !== valueToRemove))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selected?.map((value) => {
          const option = options.find((opt) => opt.value === value)
          if (!option) return null

          return (
            <Badge key={value} variant="secondary">
              {option.label}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault()
                  handleRemove(value)
                }}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {option.label}</span>
              </Button>
            </Badge>
          )
        })}
      </div>
      <Select onValueChange={handleSelect}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={selected?.includes(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

