import { getCategoryLabel, CATEGORY_BADGE_CLASS, BLOG_CATEGORY_MAP } from '../../data/blog/categories'
import { buildTableOfContents } from '../../data/blog/utils'
import BlogArticleCta from './BlogArticleCta'

function renderSection(section, skin) {
  if (section.type === 'h2') {
    return (
      <h2 className={`mt-10 scroll-mt-24 text-xl font-black sm:text-2xl ${skin.heading}`} id={section.id}>
        {section.title}
      </h2>
    )
  }
  if (section.type === 'h3') {
    return (
      <h3 className={`mt-6 scroll-mt-24 text-lg font-black ${skin.heading}`} id={section.id}>
        {section.title}
      </h3>
    )
  }
  if (section.type === 'p') {
    return <p className={`mt-4 text-sm leading-7 sm:text-base ${skin.body}`}>{section.content}</p>
  }
  return null
}

export default function BlogArticleContent({ article, isDark, skin }) {
  const toc = buildTableOfContents(article.sections)
  const category = BLOG_CATEGORY_MAP[article.category]
  const badgeClass = category ? CATEGORY_BADGE_CLASS[category.color] : CATEGORY_BADGE_CLASS.blue

  return (
    <article className="min-w-0">
      <div className={`${skin.card} overflow-hidden`}>
        <div className="aspect-[21/9] overflow-hidden bg-slate-100">
          <img
            alt={article.coverImageAlt}
            className="h-full w-full object-cover"
            decoding="async"
            fetchPriority="high"
            height={450}
            src={article.coverImage}
            width={1050}
          />
        </div>
        <div className="p-6 sm:p-8 lg:p-10">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${badgeClass}`}
          >
            {getCategoryLabel(article.category)}
          </span>

          {toc.length > 0 && (
            <nav
              aria-label="Sommaire de l'article"
              className={`mt-6 rounded-2xl border p-4 sm:p-5 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-300 bg-slate-50'}`}
            >
              <h2 className={`text-sm font-black uppercase tracking-wide ${skin.heading}`}>Sommaire</h2>
              <ol className="mt-3 space-y-2">
                {toc.map((item) => (
                  <li className={item.level === 3 ? 'ml-4' : ''} key={item.id}>
                    <a
                      className={`text-sm font-semibold transition ${isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}
                      href={`#${item.id}`}
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="mt-6">{article.sections.map((section, index) => renderSection(section, skin, index))}</div>

          {article.faq?.length > 0 && (
            <section aria-labelledby="article-faq" className="mt-12">
              <h2 className={`text-xl font-black sm:text-2xl ${skin.heading}`} id="article-faq">
                Questions fréquentes
              </h2>
              <div className="mt-5 space-y-4">
                {article.faq.map((item) => (
                  <div
                    className={`rounded-2xl border p-4 sm:p-5 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-300 bg-white'}`}
                    key={item.question}
                  >
                    <h3 className={`text-base font-black ${skin.heading}`}>{item.question}</h3>
                    <p className={`mt-2 text-sm leading-7 ${skin.bodyMuted}`}>{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <BlogArticleCta isDark={isDark} skin={skin} />
        </div>
      </div>
    </article>
  )
}
