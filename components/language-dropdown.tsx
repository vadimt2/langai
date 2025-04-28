"use client"
import type React from "react"
import { useCallback, useState, forwardRef, useEffect, useMemo } from "react"

// shadcn
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// utils
import { cn } from "@/lib/utils"

// assets
import { ChevronDown, CheckIcon, Globe } from "lucide-react"
import { CircleFlag } from "react-circle-flags"

// data
import { languages, type Language } from "@/data/languages"

// Dropdown props
interface LanguageDropdownProps {
  options?: Language[]
  onChange?: (language: Language) => void
  defaultValue?: string
  disabled?: boolean
  placeholder?: string
  slim?: boolean
}

// Number of items to render at once in the virtualized list
const ITEMS_PER_PAGE = 20

const LanguageDropdownComponent = (
  {
    options = languages,
    onChange,
    defaultValue,
    disabled = false,
    placeholder = "Select a language",
    slim = false,
    ...props
  }: LanguageDropdownProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) => {
  const [open, setOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<Language | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [visibleItemsCount, setVisibleItemsCount] = useState(ITEMS_PER_PAGE)
  const [scrollPosition, setScrollPosition] = useState(0)

  // Memoize filtered options to prevent recalculation on every render
  const memoizedOptions = useMemo(() => options, [options])

  // Filter languages based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return memoizedOptions

    return memoizedOptions.filter(
      (language) =>
        language.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        language.nativeName.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [memoizedOptions, searchQuery])

  // Get only the visible items based on current scroll position
  const visibleItems = useMemo(() => {
    return filteredOptions.slice(0, visibleItemsCount)
  }, [filteredOptions, visibleItemsCount])

  // Handle scroll event in the dropdown
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      setScrollPosition(scrollTop)

      // If we're near the bottom, load more items
      if (scrollHeight - scrollTop - clientHeight < 200) {
        setVisibleItemsCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredOptions.length))
      }
    },
    [filteredOptions.length],
  )

  // Reset visible items when search query changes
  useEffect(() => {
    setVisibleItemsCount(ITEMS_PER_PAGE)
  }, [searchQuery])

  // Reset scroll position when dropdown opens
  useEffect(() => {
    if (open) {
      setScrollPosition(0)
    }
  }, [open])

  useEffect(() => {
    if (defaultValue) {
      const initialLanguage = memoizedOptions.find((language) => language.code === defaultValue)
      if (initialLanguage) {
        setSelectedLanguage(initialLanguage)
      } else {
        // Reset selected language if defaultValue is not found
        setSelectedLanguage(undefined)
      }
    } else {
      // Reset selected language if defaultValue is undefined or null
      setSelectedLanguage(undefined)
    }
  }, [defaultValue, memoizedOptions])

  const handleSelect = useCallback(
    (language: Language) => {
      setSelectedLanguage(language)
      onChange?.(language)
      setOpen(false)
    },
    [onChange],
  )

  const triggerClasses = cn(
    "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-2xs ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
    slim === true && "w-20",
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger ref={ref} className={triggerClasses} disabled={disabled} {...props}>
        {selectedLanguage ? (
          <div className="flex items-center grow w-0 gap-2 overflow-hidden">
            <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
              <CircleFlag countryCode={selectedLanguage.countryCode.toLowerCase()} height={20} />
            </div>
            {slim === false && (
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{selectedLanguage.name}</span>
            )}
          </div>
        ) : (
          <span>{slim === false ? placeholder || selectedLanguage?.name : <Globe size={20} />}</span>
        )}
        <ChevronDown size={16} />
      </PopoverTrigger>
      <PopoverContent collisionPadding={10} side="bottom" className="min-w-(--radix-popper-anchor-width) p-0">
        <Command className="w-full">
          <CommandList className="max-h-[300px] sm:max-h-[400px] overflow-auto" onScroll={handleScroll}>
            <div className="sticky top-0 z-10 bg-popover">
              <CommandInput placeholder="Search language..." value={searchQuery} onValueChange={setSearchQuery} />
            </div>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {visibleItems
                .filter((x) => x.name)
                .map((option, key: number) => (
                  <CommandItem
                    className="flex items-center w-full gap-2"
                    key={key}
                    onSelect={() => handleSelect(option)}
                  >
                    <div className="flex grow w-0 space-x-2 overflow-hidden">
                      <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
                        <CircleFlag countryCode={option.countryCode.toLowerCase()} height={20} />
                      </div>
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{option.name}</span>
                      {option.nativeName !== option.name && (
                        <span className="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                          ({option.nativeName})
                        </span>
                      )}
                    </div>
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4 shrink-0",
                        option.code === selectedLanguage?.code ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              {filteredOptions.length > visibleItemsCount && (
                <div className="py-2 px-4 text-xs text-center text-muted-foreground">Scroll for more languages</div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

LanguageDropdownComponent.displayName = "LanguageDropdownComponent"

export const LanguageDropdown = forwardRef(LanguageDropdownComponent)
