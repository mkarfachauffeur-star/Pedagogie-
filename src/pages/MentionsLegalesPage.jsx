import {
  LEGAL_DATABASE,
  LEGAL_DOMAIN,
  LEGAL_EMAIL_PROVIDER,
  LEGAL_ENTITY,
  LEGAL_HOSTING,
  LEGAL_SITE,
  formatLegalHostingAddress,
} from '../config/legal'
import LegalContactBlock from '../components/legal/LegalContactBlock'
import LegalPage from '../components/legal/LegalPage'
import LegalParagraph from '../components/legal/LegalParagraph'
import LegalSection from '../components/legal/LegalSection'

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      intro="Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN), les informations suivantes sont portées à la connaissance des utilisateurs du site Pedagogia Drive."
      seoKey="mentionsLegales"
      title="Mentions légales"
    >
      <LegalSection id="hebergeur" title="Hébergeur">
        <LegalParagraph>
          <strong>{LEGAL_HOSTING.name}</strong>
          {formatLegalHostingAddress().map((line) => (
            <span key={line}>
              <br />
              {line}
            </span>
          ))}
          <br />
          <a className="font-semibold text-cyan-700 hover:text-cyan-800" href={LEGAL_HOSTING.website} rel="noopener noreferrer" target="_blank">
            vercel.com
          </a>
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="nom-de-domaine" title="Nom de domaine">
        <LegalParagraph>
          Site web :{' '}
          <a className="font-semibold text-cyan-700 hover:text-cyan-800" href={LEGAL_SITE.url}>
            {LEGAL_SITE.url}
          </a>
          <br />
          Nom de domaine : <strong>{LEGAL_DOMAIN.name}</strong>
          <br />
          Registrar : {LEGAL_DOMAIN.registrar}
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="base-de-donnees" title="Base de données">
        <LegalParagraph>
          Hébergement des données : {LEGAL_DATABASE.provider} — région {LEGAL_DATABASE.region}.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="emails" title="Service d'envoi d'e-mails">
        <LegalParagraph>
          Les e-mails transactionnels (invitations, notifications, accès) sont envoyés via{' '}
          {LEGAL_EMAIL_PROVIDER.name}.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="propriete-intellectuelle" title="Propriété intellectuelle">
        <LegalParagraph>
          L&apos;ensemble du site <strong>{LEGAL_ENTITY.tradeName}</strong>, de sa structure, de ses textes, graphismes,
          logos, icônes, logiciels et bases de données est la propriété exclusive de{' '}
          <strong>{LEGAL_ENTITY.companyName}</strong> ou de ses partenaires. Toute reproduction, représentation,
          modification ou exploitation non autorisée est interdite.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="responsabilite" title="Responsabilité">
        <LegalParagraph>
          <strong>{LEGAL_ENTITY.tradeName}</strong> s&apos;efforce d&apos;assurer l&apos;exactitude des informations publiées.
          Toutefois, l&apos;éditeur ne saurait être tenu responsable des erreurs, omissions ou indisponibilités
          temporaires du service. L&apos;utilisateur reste seul responsable de l&apos;usage qu&apos;il fait de la
          plateforme et des données qu&apos;il y saisit.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="donnees-personnelles" title="Données personnelles">
        <LegalParagraph>
          Le traitement des données personnelles est décrit dans notre{' '}
          <a className="font-semibold text-cyan-700 hover:text-cyan-800" href="/politique-confidentialite">
            politique de confidentialité
          </a>
          .
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <LegalContactBlock />
      </LegalSection>
    </LegalPage>
  )
}
