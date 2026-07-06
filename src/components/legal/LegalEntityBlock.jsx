import { LEGAL_ENTITY, formatLegalAddress, hasLegalValue } from '../../config/legal'

function idLabel(country) {
  return country === 'Luxembourg' ? 'RCS' : 'SIREN'
}

export default function LegalEntityBlock() {
  const addressLines = formatLegalAddress()
  const showTradeName =
    hasLegalValue(LEGAL_ENTITY.tradeName) &&
    LEGAL_ENTITY.tradeName !== LEGAL_ENTITY.companyName

  return (
    <div className="space-y-1">
      <p className="font-semibold text-slate-800">{LEGAL_ENTITY.companyName}</p>
      {showTradeName ? <p>{LEGAL_ENTITY.tradeName}</p> : null}
      {hasLegalValue(LEGAL_ENTITY.legalForm) ? <p>{LEGAL_ENTITY.legalForm}</p> : null}
      {addressLines.map((line) => (
        <p key={line}>{line}</p>
      ))}
      {hasLegalValue(LEGAL_ENTITY.siren) ? (
        <p>
          {idLabel(LEGAL_ENTITY.country)} : {LEGAL_ENTITY.siren}
        </p>
      ) : null}
      {hasLegalValue(LEGAL_ENTITY.siret) ? <p>SIRET : {LEGAL_ENTITY.siret}</p> : null}
      {hasLegalValue(LEGAL_ENTITY.vatNumber) ? <p>TVA : {LEGAL_ENTITY.vatNumber}</p> : null}
    </div>
  )
}
