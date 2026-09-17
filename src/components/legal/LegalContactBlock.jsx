import { LEGAL_ENTITY, legalMailto } from '../../config/legal'

export default function LegalContactBlock({
  label = 'Contact',
  email = LEGAL_ENTITY.email,
  phone = LEGAL_ENTITY.phone,
}) {
  return (
    <address className="not-italic">
      <p className="font-semibold text-[var(--lp-muted-strong)]">{label}</p>
      <p>
        <a className="font-semibold text-[var(--lp-blue)] hover:text-[var(--lp-blue-hover)]" href={legalMailto(email)}>
          {email}
        </a>
      </p>
      {phone ? <p>{phone}</p> : null}
    </address>
  )
}
