import { Skeleton } from '@heroui/skeleton'
import { sendGTMEvent } from '@next/third-parties/google'
import useRecentSearches from 'hooks/useRecentSearches'
import { useShouldAutoFocusSearch } from 'hooks/useShouldAutoFocusSearch'
import { debounce } from 'lodash'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState, useMemo } from 'react'
import { FaSearch, FaTimes } from 'react-icons/fa'
import { isValidSearchQuery } from 'utils/helpers/searchHelpers'

interface SearchProps {
  isLoaded: boolean
  onSearch: (query: string) => void
  placeholder: string
  initialValue?: string
  className?: string
  storageKey?: string
}

/** True when search is visually joined to filter/sort (tighter outer padding). */
function joinedToolbarInputClass(className: string): boolean {
  return (
    /(?:^|\s)rounded-none(?:\s|$)/.test(className) ||
    /(?:^|\s)rounded-r-none(?:\s|$)/.test(className) ||
    /\bmd:rounded-none\b/.test(className) ||
    /\bmd:rounded-r-none\b/.test(className)
  )
}

const SearchBar: React.FC<SearchProps> = ({
  isLoaded,
  onSearch,
  placeholder,
  initialValue = '',
  className = '',
  storageKey = 'recentSearchResults:projects',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialValue)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const shouldAutoFocus = useShouldAutoFocusSearch()
  const { recentSearchResults, removeRecentSearch, addRecentSearch } = useRecentSearches(storageKey)

  const cleanSearchQuery = searchQuery.trim()

  useEffect(() => {
    setSearchQuery(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (isLoaded && shouldAutoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [pathname, isLoaded, shouldAutoFocus])

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        const cleanQuery = query.trim()

        if (!cleanQuery || !isValidSearchQuery(cleanQuery)) {
          onSearch('')
          return
        }

        if (cleanQuery !== '') {
          onSearch(query)
          addRecentSearch(cleanQuery)
          sendGTMEvent({
            event: 'search',
            path: globalThis.location.pathname,
            value: query,
          })
        }
      }, 750),
    [onSearch, addRecentSearch]
  )

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setSearchQuery(newQuery)
    debouncedSearch(newQuery)
  }

  const handleClearSearch = () => {
    debouncedSearch.cancel()
    setSearchQuery('')
    onSearch('')
    if (shouldAutoFocus) {
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClearSearch()
    }
  }

  const handleSelectRecentSearch = (query: string) => {
    debouncedSearch.cancel()
    setSearchQuery(query)
    onSearch(query)
    addRecentSearch(query)
  }

  const showInvalidQueryMessage =
    isLoaded && Boolean(cleanSearchQuery) && !isValidSearchQuery(cleanSearchQuery)

  const showRecentSearches =
    isLoaded &&
    isFocused &&
    searchQuery.trim() === '' &&
    Array.isArray(recentSearchResults) &&
    recentSearchResults.length > 0

  const hasDropdown = showRecentSearches || showInvalidQueryMessage

  return (
    <div
      className={`w-full max-w-xl md:py-4 ${joinedToolbarInputClass(className) ? 'p-0' : 'md:p-4'}`}
    >
      <div className="relative">
        {isLoaded ? (
          <div
            className={
              hasDropdown
                ? 'rounded-xl border border-gray-300 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800'
                : ''
            }
          >
            <div className="relative">
              <FaSearch
                className="pointer-events-none absolute top-6 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={handleSearchChange}
                placeholder={placeholder}
                className={`box-border h-12 w-full py-0 pr-10 pl-10 text-sm leading-12 text-black placeholder:leading-12 placeholder:text-gray-500 focus:outline-hidden dark:text-white dark:placeholder:text-gray-400 ${
                  hasDropdown
                    ? 'rounded-t-xl rounded-b-none border-0 bg-transparent focus:border-0 focus:ring-0 dark:focus:ring-0'
                    : `rounded-lg border-1 border-gray-200 bg-white focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-blue-300 ${className}`
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md p-1 text-gray-400 hover:bg-gray-400 hover:text-gray-200 focus:ring-2 focus:ring-gray-300 focus:outline-hidden dark:hover:bg-gray-600"
                  onClick={handleClearSearch}
                  onKeyDown={handleKeyDown}
                  aria-label="Clear search"
                >
                  <FaTimes className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {showInvalidQueryMessage && (
              <div className="border-t border-gray-200 px-4 py-2.5 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Only letters, numbers, spaces, hyphens, underscores, and periods are allowed.
              </div>
            )}

            {showRecentSearches && (
              <div className="flex flex-col gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">Recent:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {recentSearchResults.slice(0, 3).map((item: string) => (
                    <div
                      key={item}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                    >
                      <button
                        type="button"
                        title={item}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSelectRecentSearch(item)
                        }}
                        className="block max-w-28 truncate hover:underline"
                      >
                        {item}
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeRecentSearch(item)
                        }}
                        aria-label={`Remove ${item}`}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
                      >
                        <FaTimes className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Skeleton className={`h-12 rounded-lg ${className}`} />
        )}
      </div>
    </div>
  )
}

export default SearchBar
