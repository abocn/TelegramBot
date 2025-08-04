"use client"

/*
Adapted from https://ui.shadcn.com/docs/components/combobox
*/

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, Cpu, Brain, ShieldOff } from "lucide-react"
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
import { models } from "./ai"

interface ModelPickerProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

export function ModelPicker({ value, onValueChange, disabled = false, className }: ModelPickerProps) {
  const [open, setOpen] = React.useState(false)

  const currentModel = React.useMemo(() => {
    for (const category of models) {
      const model = category.models.find(m => m.name === value)
      if (model) {
        return {
          model,
          category: category.label,
          categoryDescription: category.descriptionEn
        }
      }
    }
    return null
  }, [value])

  const handleSelect = (modelName: string) => {
    onValueChange?.(modelName)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between h-auto p-4 overflow-hidden", className)}
        >
          <div className="flex items-start gap-3 text-left flex-1 overflow-hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 mt-0.5">
              <Cpu className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {currentModel ? (
                <>
                  <div className="font-medium text-sm truncate">{currentModel.model.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{currentModel.category}</div>
                  <div className="text-xs text-muted-foreground/70 mt-1 truncate">
                    {currentModel.categoryDescription}
                  </div>
                  <div className="flex items-center gap-1 mt-2 flex-wrap overflow-hidden">
                    <span className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                      {currentModel.model.parameterSize}
                    </span>
                    {currentModel.model.thinking && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded text-xs font-medium flex items-center gap-1">
                        <Brain />
                        Thinking
                      </span>
                    )}
                    {currentModel.model.uncensored && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded text-xs font-medium flex items-center gap-1">
                        <ShieldOff />
                        Uncensored
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">Select a model...</div>
              )}
            </div>
          </div>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No model found.</CommandEmpty>
            {models.map((category) => (
              <CommandGroup key={category.name} heading={category.label}>
                <div className="pb-2 ml-2 mb-1 text-xs text-muted-foreground/70">
                  {category.descriptionEn}
                </div>
                {category.models.map((model) => (
                  <CommandItem
                    key={model.name}
                    value={`${category.label} ${model.label} ${model.parameterSize}`}
                    onSelect={() => handleSelect(model.name)}
                    className="flex items-center gap-3 py-3 cursor-pointer"
                  >
                    <CheckIcon
                      className={cn(
                        "h-4 w-4",
                        value === model.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{model.label}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                          {model.parameterSize}
                        </span>
                        {model.thinking && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded text-xs font-medium flex items-center gap-1">
                            <Brain />
                            Thinking
                          </span>
                        )}
                        {model.uncensored && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded text-xs font-medium flex items-center gap-1">
                            <ShieldOff />
                            Uncensored
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
