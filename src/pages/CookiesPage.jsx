import { LEGAL_ANALYTICS, LEGAL_ENTITY } from '../config/legal'
import LegalList from '../components/legal/LegalList'
import LegalPage from '../components/legal/LegalPage'
import LegalParagraph from '../components/legal/LegalParagraph'
import LegalSection from '../components/legal/LegalSection'

export default function CookiesPage() {
  return (
    <LegalPage
      intro={`Cette politique explique comment ${LEGAL_ENTITY.tradeName} utilise des cookies et traceurs sur le site public et, le cas échéant, dans l'application.`}
      seoKey="cookies"
      title="Politique de cookies"
    >
      <LegalSection id="cookies-techniques" title="Cookies techniques">
        <LegalParagraph>
          Ces cookies sont strictement nécessaires au fonctionnement du site et de l&apos;application
          (session, authentification, sécurité, préférences d&apos;interface). Ils ne nécessitent pas votre
          consentement préalable.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="cookies-audience" title="Cookies de mesure d'audience">
        <LegalParagraph>
          Nous utilisons {LEGAL_ANALYTICS.provider} sur le site marketing afin de mesurer la fréquentation
          et améliorer nos pages. Ces cookies ne sont déposés qu&apos;en production et peuvent être soumis
          à votre consentement selon la réglementation applicable.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="cookies-tiers" title="Cookies tiers">
        <LegalParagraph>
          Certains services tiers intégrés (polices web, hébergeur, outils de support) peuvent déposer
          leurs propres cookies. Nous limitons leur usage au strict nécessaire.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="duree" title="Durée de conservation">
        <LegalList
          items={[
            'Cookies de session : supprimés à la fermeture du navigateur',
            'Cookies d\'authentification : durée limitée selon la session Supabase',
            'Cookies analytics : jusqu\'à 13 mois maximum (selon configuration GA4)',
          ]}
        />
      </LegalSection>

      <LegalSection id="preferences" title="Gestion des préférences">
        <LegalParagraph>
          Vous pouvez refuser ou supprimer les cookies via les paramètres de votre navigateur. Le refus
          des cookies techniques peut empêcher l&apos;utilisation de certaines fonctionnalités. Pour les
          cookies analytics, vous pouvez utiliser les extensions de désactivation proposées par Google ou
          configurer votre navigateur en mode « Do Not Track ».
        </LegalParagraph>
        <LegalParagraph>
          Pour toute question :{' '}
          <a className="font-semibold text-cyan-700 hover:text-cyan-800" href={`mailto:${LEGAL_ENTITY.dpoEmail}`}>
            {LEGAL_ENTITY.dpoEmail}
          </a>
        </LegalParagraph>
      </LegalSection>
    </LegalPage>
  )
}
