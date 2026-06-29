import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BlogArticleCard from '../components/blog/BlogArticleCard'
import BlogPagination from '../components/blog/BlogPagination'
import BlogSidebar from '../components/blog/BlogSidebar'
import PageSeo from '../components/seo/PageSeo'
import BlogMarketingLayout, { useBlogSkin } from '../layouts/BlogMarketingLayout'
import {
  filterPosts,
  getLatestPosts,
  getPopularPosts,
} from '../data/blog/utils'
import {
  buildBlogListJsonLd,
  SEO_PAGES,
} from '../lib/seo'

const PER_PAGE = 6

export default function BlogListPage() {
  const { skin, isDark } = useBlogSkin()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '')
  const selectedCategory = searchParams.get('category') ?? ''
  const page = Number(searchParams.get('page') ?? 1)

  const { posts, total, totalPages } = useMemo(
    () =>
      filterPosts({
        query: searchParams.get('q') ?? '',
        category: selectedCategory,
        page,
        perPage: PER_PAGE,
      }),
    [page, searchParams, selectedCategory],
  )

  const popularPosts = useMemo(() => getPopularPosts(5), [])
  const latestPosts = useMemo(() => getLatestPosts(5), [])

  const jsonLd = useMemo(() => buildBlogListJsonLd(), [])
  const pageSeo = SEO_PAGES.blog

  function updateParams(next) {
    const params = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([key, value]) => {
      if (!value) params.delete(key)
      else params.set(key, String(value))
    })
    setSearchParams(params, { replace: true })
  }

  function handleSearchChange(value) {
    setSearchQuery(value)
    updateParams({ q: value, page: 1 })
  }

  function handleCategoryChange(category) {
    updateParams({ category, page: 1 })
  }

  function handlePageChange(nextPage) {
    updateParams({ page: nextPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <BlogMarketingLayout>
      <PageSeo {...pageSeo} jsonLd={jsonLd} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <header className="mx-auto max-w-3xl text-center">
          <p className={skin.eyebrowBlue}>Ressources</p>
          <h1 className={`mt-3 text-3xl font-black sm:text-4xl ${skin.heading}`}>
            Blog Pedagogia Drive
          </h1>
          <p className={`mt-4 text-base leading-8 ${skin.bodyMuted}`}>
            Conseils, guides et actualités pour les gérants d&apos;auto-école : livret numérique,
            REMC, suivi pédagogique et digitalisation.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
          <section aria-label="Liste des articles">
            {posts.length === 0 ? (
              <div className={`${skin.card} p-8 text-center`}>
                <p className={`text-base font-semibold ${skin.body}`}>
                  Aucun article ne correspond à votre recherche.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {posts.map((article) => (
                  <BlogArticleCard article={article} isDark={isDark} key={article.slug} skin={skin} />
                ))}
              </div>
            )}
            <BlogPagination isDark={isDark} onPageChange={handlePageChange} page={page} totalPages={totalPages} />
            {total > 0 && (
              <p className={`mt-4 text-center text-xs font-semibold ${skin.bodyMuted}`}>
                {total} article{total > 1 ? 's' : ''} au total
              </p>
            )}
          </section>

          <BlogSidebar
            isDark={isDark}
            latestPosts={latestPosts}
            onCategoryChange={handleCategoryChange}
            onNavigate={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            onSearchChange={handleSearchChange}
            popularPosts={popularPosts}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            skin={skin}
          />
        </div>
      </div>
    </BlogMarketingLayout>
  )
}
