import { BLOG_POSTS } from './posts/index.js'

const WORDS_PER_MINUTE = 200

export function countWords(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function countArticleWords(article) {
  const sectionText = (article.sections ?? [])
    .flatMap((s) => [s.title, s.content].filter(Boolean))
    .join(' ')
  const faqText = (article.faq ?? []).flatMap((f) => [f.question, f.answer]).join(' ')
  return countWords(`${article.excerpt} ${sectionText} ${faqText}`)
}

export function getReadingTimeMinutes(article) {
  const words = countArticleWords(article)
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}

export function formatBlogDate(isoDate) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoDate))
}

export function getPostBySlug(slug) {
  return BLOG_POSTS.find((post) => post.slug === slug) ?? null
}

export function getAllPostsSorted() {
  return [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
}

export function getPopularPosts(limit = 5) {
  return getAllPostsSorted()
    .filter((post) => post.popular)
    .slice(0, limit)
}

export function getLatestPosts(limit = 5) {
  return getAllPostsSorted().slice(0, limit)
}

export function getRelatedPosts(article, limit = 3) {
  return getAllPostsSorted()
    .filter((post) => post.slug !== article.slug && post.category === article.category)
    .slice(0, limit)
}

export function filterPosts({ query = '', category = '', page = 1, perPage = 6 } = {}) {
  const normalizedQuery = query.trim().toLowerCase()
  let results = getAllPostsSorted()

  if (category) {
    results = results.filter((post) => post.category === category)
  }

  if (normalizedQuery) {
    results = results.filter((post) => {
      const haystack = [
        post.title,
        post.excerpt,
        post.metaDescription,
        ...(post.sections ?? []).flatMap((s) => [s.title, s.content]),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }

  const total = results.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * perPage

  return {
    posts: results.slice(start, start + perPage),
    total,
    page: safePage,
    totalPages,
    perPage,
  }
}

export function buildTableOfContents(sections = []) {
  return sections
    .filter((section) => section.type === 'h2' || section.type === 'h3')
    .map((section) => ({
      id: section.id,
      title: section.title,
      level: section.type === 'h2' ? 2 : 3,
    }))
}

export function buildTableOfContentsTree(sections = []) {
  const tree = []
  let currentSection = null

  for (const item of buildTableOfContents(sections)) {
    if (item.level === 2) {
      currentSection = { ...item, children: [] }
      tree.push(currentSection)
      continue
    }

    if (currentSection) {
      currentSection.children.push(item)
    } else {
      tree.push({ ...item, children: [] })
    }
  }

  return tree
}

export function getAllBlogSlugs() {
  return BLOG_POSTS.map((post) => post.slug)
}
