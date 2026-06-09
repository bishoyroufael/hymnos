import { ContentType } from "../models";

/**
 * Search filter configuration
 * Enables granular control over what gets searched
 */
export interface SearchFilters {
  /** Search hymn metadata (name, author, composer) */
  hymnMetadata: boolean;

  /** Search within hymn slide content/lyrics */
  hymnContent: boolean;

  /** Search bible books and chapters by name/reference (e.g., "متى 5:3") */
  bibleReference: boolean;

  /** Search within bible verse content/text */
  bibleContent: boolean;

  /** Search book metadata (name, author, description) */
  bookMetadata: boolean;

  /** Search within book section slide content */
  bookContent: boolean;
}

/**
 * Default search filters - all enabled
 */
export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  hymnMetadata: true,
  hymnContent: true,
  bibleReference: true,
  bibleContent: true,
  bookMetadata: true,
  bookContent: true,
};

/**
 * Preset filter configurations for common use cases
 */
export const SEARCH_FILTER_PRESETS = {
  /** Search everything */
  all: DEFAULT_SEARCH_FILTERS,

  /** Only search hymn-related content */
  hymnsOnly: {
    hymnMetadata: true,
    hymnContent: true,
    bibleReference: false,
    bibleContent: false,
    bookMetadata: false,
    bookContent: false,
  },

  /** Only search bible-related content */
  bibleOnly: {
    hymnMetadata: false,
    hymnContent: false,
    bibleReference: true,
    bibleContent: true,
    bookMetadata: false,
    bookContent: false,
  },

  /** Search only metadata (names, references) - fast search */
  metadataOnly: {
    hymnMetadata: true,
    hymnContent: false,
    bibleReference: true,
    bibleContent: false,
    bookMetadata: true,
    bookContent: false,
  },

  /** Search only content (lyrics, verses) - deep search */
  contentOnly: {
    hymnMetadata: false,
    hymnContent: true,
    bibleReference: false,
    bibleContent: true,
    bookMetadata: false,
    bookContent: true,
  },
} as const;

/**
 * User-friendly filter display configuration
 */
export interface SearchFilterOption {
  key: keyof SearchFilters;
  label: string;
  description: string;
  group: 'hymn' | 'bible' | 'book';
}

export const SEARCH_FILTER_OPTIONS: SearchFilterOption[] = [
  {
    key: 'hymnMetadata',
    label: 'أسماء التراتيل',
    description: 'ابحث في اسم الترنيمة، المؤلف، والملحن',
    group: 'hymn',
  },
  {
    key: 'hymnContent',
    label: 'كلمات التراتيل',
    description: 'ابحث داخل نص وكلمات الترنيمة',
    group: 'hymn',
  },
  {
    key: 'bibleReference',
    label: 'أسفار الكتاب المقدس',
    description: 'ابحث في أسماء الأسفار والإصحاحات (مثل: متى 5)',
    group: 'bible',
  },
  {
    key: 'bibleContent',
    label: 'آيات الكتاب المقدس',
    description: 'ابحث داخل نص الآيات',
    group: 'bible',
  },
  {
    key: 'bookMetadata',
    label: 'أسماء الكتب',
    description: 'ابحث في اسم الكتاب، المؤلف، والوصف',
    group: 'book',
  },
  {
    key: 'bookContent',
    label: 'محتوى الكتب',
    description: 'ابحث داخل نصوص أقسام الكتب',
    group: 'book',
  },
];

/**
 * Helper function to check if any filters are enabled
 */
export function hasAnyFiltersEnabled(filters: SearchFilters): boolean {
  return Object.values(filters).some(Boolean);
}

/**
 * Helper function to get content types for slide search based on filters
 */
export function getContentTypesForSlideSearch(filters: SearchFilters): ContentType[] {
  const types: ContentType[] = [];

  if (filters.hymnContent) {
    types.push(ContentType.hymn);
  }

  if (filters.bibleContent) {
    types.push(ContentType.bible_chapter);
  }

  return types;
}
