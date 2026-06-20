// Verified against the live site structure. Top-level nav items change rarely (they're the site's information architecture), so we treat this as a curated baseline rather than re-deriving it from a fragile regex parse of a deeply-nested mega-menu on every scrape. Product listings and prices — the data that actually changes — are still scraped live.

export interface CategorySeed {
  title: string;
  slug: string;
  sourceUrl: string;
}

export interface NavigationSeed {
  title: string;
  slug: string;
  sourceUrl: string;
  categories: CategorySeed[];
}

const BASE = 'https://www.worldofbooks.com';

export const WORLD_OF_BOOKS_TAXONOMY: NavigationSeed[] = [
  {
    title: 'Fiction Books',
    slug: 'fiction',
    sourceUrl: `${BASE}/pages/fiction`,
    categories: [
      {
        title: 'All Fiction Books',
        slug: 'fiction-books',
        sourceUrl: `${BASE}/collections/fiction-books`,
      },
      {
        title: 'Crime & Mystery',
        slug: 'crime-and-mystery-books',
        sourceUrl: `${BASE}/collections/crime-and-mystery-books`,
      },
      {
        title: 'Fantasy',
        slug: 'fantasy-fiction-books',
        sourceUrl: `${BASE}/collections/fantasy-fiction-books`,
      },
      {
        title: 'Modern Fiction',
        slug: 'modern-fiction-books',
        sourceUrl: `${BASE}/collections/modern-fiction-books`,
      },
      {
        title: 'Adventure',
        slug: 'adventure-books',
        sourceUrl: `${BASE}/collections/adventure-books`,
      },
      {
        title: 'Thriller & Suspense',
        slug: 'thriller-and-suspense-books',
        sourceUrl: `${BASE}/collections/thriller-and-suspense-books`,
      },
      {
        title: 'Classic Fiction',
        slug: 'classic-fiction-books',
        sourceUrl: `${BASE}/collections/classic-fiction-books`,
      },
      {
        title: 'Graphic Novels',
        slug: 'graphic-novels-and-comic-books',
        sourceUrl: `${BASE}/collections/graphic-novels-and-comic-books`,
      },
      {
        title: 'Historical Fiction',
        slug: 'historical-fiction-books',
        sourceUrl: `${BASE}/collections/historical-fiction-books`,
      },
      {
        title: 'Horror & Ghost Stories',
        slug: 'horror-books',
        sourceUrl: `${BASE}/collections/horror-books`,
      },
      {
        title: 'Sagas',
        slug: 'sagas-books',
        sourceUrl: `${BASE}/collections/sagas-books`,
      },
      {
        title: 'Science Fiction',
        slug: 'science-fiction-books',
        sourceUrl: `${BASE}/collections/science-fiction-books`,
      },
    ],
  },
  {
    title: 'Non-Fiction Books',
    slug: 'non-fiction',
    sourceUrl: `${BASE}/pages/non-fiction`,
    categories: [
      {
        title: 'All Non-Fiction Books',
        slug: 'non-fiction-books',
        sourceUrl: `${BASE}/collections/non-fiction-books`,
      },
      {
        title: 'Biography & True Stories',
        slug: 'biography-and-true-story-books',
        sourceUrl: `${BASE}/collections/biography-and-true-story-books`,
      },
      {
        title: 'Health & Personal Development',
        slug: 'health-and-personal-development-books',
        sourceUrl: `${BASE}/collections/health-and-personal-development-books`,
      },
      {
        title: 'Lifestyle, Cooking & Leisure',
        slug: 'lifestyle-cooking-and-leisure-books',
        sourceUrl: `${BASE}/collections/lifestyle-cooking-and-leisure-books`,
      },
      {
        title: 'Reference Books',
        slug: 'reference-books',
        sourceUrl: `${BASE}/collections/reference-books`,
      },
      {
        title: 'Arts Books',
        slug: 'arts-books',
        sourceUrl: `${BASE}/collections/arts-books`,
      },
      {
        title: 'Computing & IT',
        slug: 'computing-and-it-books',
        sourceUrl: `${BASE}/collections/computing-and-it-books`,
      },
      {
        title: 'Humanities Books',
        slug: 'humanities-books',
        sourceUrl: `${BASE}/collections/humanities-books`,
      },
      {
        title: 'Literature & Literary Studies',
        slug: 'literature-and-literary-studies-books',
        sourceUrl: `${BASE}/collections/literature-and-literary-studies-books`,
      },
      {
        title: 'Mathematics & Science',
        slug: 'mathematics-and-science-books',
        sourceUrl: `${BASE}/collections/mathematics-and-science-books`,
      },
      {
        title: 'Medicine',
        slug: 'medical-books',
        sourceUrl: `${BASE}/collections/medical-books`,
      },
      {
        title: 'Technology',
        slug: 'technology-books',
        sourceUrl: `${BASE}/collections/technology-books`,
      },
    ],
  },
  {
    title: "Children's Books",
    slug: 'childrens',
    sourceUrl: `${BASE}/pages/childrens`,
    categories: [
      {
        title: "All Children's Books",
        slug: 'childrens-books',
        sourceUrl: `${BASE}/collections/childrens-books`,
      },
      {
        title: "Children's Fiction & True Stories",
        slug: 'childrens-fiction-books',
        sourceUrl: `${BASE}/collections/childrens-fiction-books`,
      },
      {
        title: "Children's Non-Fiction",
        slug: 'childrens-non-fiction-books',
        sourceUrl: `${BASE}/collections/childrens-non-fiction-books`,
      },
      {
        title: 'Activity, Early Learning & Picture Books',
        slug: 'childrens-picture-and-activity-books',
        sourceUrl: `${BASE}/collections/childrens-picture-and-activity-books`,
      },
      {
        title: "Children's Reference Books",
        slug: 'childrens-reference-books',
        sourceUrl: `${BASE}/collections/childrens-reference-books`,
      },
      {
        title: "Children's Education & Learning",
        slug: 'educational-material-books',
        sourceUrl: `${BASE}/collections/educational-material-books`,
      },
      {
        title: "Children's Poetry & Anthologies",
        slug: 'childrens-poetry-books',
        sourceUrl: `${BASE}/collections/childrens-poetry-books`,
      },
    ],
  },
  {
    title: 'Rare Books',
    slug: 'rare-books',
    sourceUrl: `${BASE}/collections/rarebooks`,
    categories: [
      {
        title: 'Rare Fiction Books',
        slug: 'rare-fiction-books',
        sourceUrl: `${BASE}/collections/rare-fiction-books`,
      },
      {
        title: 'Rare Non-Fiction Books',
        slug: 'rare-non-fiction-books',
        sourceUrl: `${BASE}/collections/rare-non-fiction-books`,
      },
      {
        title: 'Rare Fantasy Books',
        slug: 'rare-fantasy-books',
        sourceUrl: `${BASE}/collections/rare-fantasy-books`,
      },
      {
        title: 'Rare Crime Books',
        slug: 'rare-crime-books',
        sourceUrl: `${BASE}/collections/rare-crime-books`,
      },
    ],
  },
  {
    title: 'Music & Film',
    slug: 'music-film',
    sourceUrl: `${BASE}/pages/music-film`,
    categories: [
      {
        title: 'All Music',
        slug: 'media-music',
        sourceUrl: `${BASE}/collections/media-music`,
      },
      {
        title: 'All DVD & Blu-Ray',
        slug: 'dvds-and-blu-ray',
        sourceUrl: `${BASE}/collections/dvds-and-blu-ray`,
      },
      {
        title: 'Video Games',
        slug: 'video-games',
        sourceUrl: `${BASE}/collections/video-games`,
      },
    ],
  },
];
