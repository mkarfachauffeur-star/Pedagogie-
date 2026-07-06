export default function LegalList({ items, ordered = false }) {
  const Tag = ordered ? 'ol' : 'ul'
  const listClass = ordered ? 'list-decimal space-y-2 pl-5' : 'list-disc space-y-2 pl-5'

  return (
    <Tag className={listClass}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </Tag>
  )
}
