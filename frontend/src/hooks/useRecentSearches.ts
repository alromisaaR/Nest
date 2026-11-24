'use client'

import { useState, useEffect, useCallback } from 'react'
import { MAX_RECENT_SEARCHES } from 'utils/searchConstants'

const DEFAULT_STORAGE_KEY = 'recentSearchResults'

const useRecentSearches = (storagekey: string = DEFAULT_STORAGE_KEY) => {
  const [recentSearchResults, setRecentSearchResults] = useState<string[]>([])

  useEffect(() => {
    try {
      const savedResults = localStorage.getItem(storagekey)
      if (savedResults) {
        const parseResults = JSON.parse(savedResults)
        if (Array.isArray(parseResults) && parseResults.every((item) => typeof item === 'string')) {
          setRecentSearchResults(parseResults)
        }
      }
    } catch {
      // Ignore errors related to localStorage access or JSON parsing
    }
  }, [storagekey])

  const setRecentSearch = useCallback(
    (updater: string[] | ((prev: string[]) => string[])) => {
      setRecentSearchResults((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        try {
          localStorage.setItem(storagekey, JSON.stringify(next))
        } catch {
          // Ignore errors related to localStorage access
        }
        return next
      })
    },
    [storagekey]
  )

  const addRecentSearch = useCallback(
    (query: string) => {
      if (query && query.trim() !== '') {
        const trimmedQuery = query.trim()
        setRecentSearch((prev: string[]) => {
          const current = Array.isArray(prev)
            ? prev.filter((item): item is string => typeof item === 'string')
            : []
          const filtered = current.filter((item) => item !== trimmedQuery)
          return [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES)
        })
      }
    },
    [setRecentSearch]
  )

  const removeRecentSearch = useCallback(
    (query: string) => {
      setRecentSearchResults((prev) => {
        const next = prev.filter((item) => item !== query)
        try {
          localStorage.setItem(storagekey, JSON.stringify(next))
        } catch {
          // Ignore errors related to localStorage access
        }
        return next
      })
    },
    [storagekey]
  )

  return { recentSearchResults, removeRecentSearch, addRecentSearch }
}

export default useRecentSearches
