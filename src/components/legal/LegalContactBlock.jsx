import { LEGAL_ENTITY, legalMailto } from '../../config/legal'

export default function LegalContactBlock({
  label = 'Contact',
  email = LEGAL_ENTITY.email,
  phone = LEGAL_ENTITY.phone,
}) {
  return (
    <address className="not-italic">
      <p className="font-semibold text-slate-800">{label}</p>
      <p>
        <a className="font-semibold text-cyan-700 hover:text-cyan-800" href={legalMailto(email)}>
          {email}
        </a>
      </p>
      {phone ? <p>{phone}</p> : null}
    </address>
  )
}
