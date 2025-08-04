"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { timezones } from "@/lib/timezones"

interface TimezoneComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

export function TimezoneCombobox({ value, onValueChange, className }: TimezoneComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between text-left", className)}
        >
          <span className="truncate">
            {value
              ? timezones.find((timezone) => timezone.value === value)?.label
              : "Select timezone..."}
          </span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search timezone..." />
          <CommandList className="max-h-60">
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {timezones.map((timezone) => (
                <CommandItem
                  key={timezone.value}
                  value={timezone.label}
                  onSelect={() => {
                    onValueChange?.(timezone.value)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === timezone.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {timezone.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}