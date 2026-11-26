export const INDEXES = ['chapters', 'events', 'organizations', 'projects', 'users']
export const SUGGESTION_COUNT = 3
export const MAX_RECENT_SEARCHES = 5
export const EMPTY_STATE_EXAMPLES =
  'Try searches like "OWASP", "London", "AppSec", "Nest", or "John".'

export const RECENT_SEARCH_STORAGE_KEYS = {
  chapters: 'recentSearchResults:chapters',
  issues: 'recentSearchResults:issues',
  events: 'recentSearchResults:events',
  projects: 'recentSearchResults:projects',
  users: 'recentSearchResults:users',
  organizations: 'recentSearchResults:organizations',
  committees: 'recentSearchResults:committees',
  programs: 'recentSearchResults:programs',
} as const
