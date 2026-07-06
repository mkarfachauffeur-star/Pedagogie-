import {
  LEGAL_ANALYTICS,
  LEGAL_DATABASE,
  LEGAL_EMAIL_PROVIDER,
  LEGAL_ENTITY,
  LEGAL_HOSTING,
  legalMailto,
} from '../config/legal'
import LegalContactBlock from '../components/legal/LegalContactBlock'
import LegalEntityBlock from '../components/legal/LegalEntityBlock'
import LegalList from '../components/legal/LegalList'
import LegalPage from '../components/legal/LegalPage'
import LegalParagraph from '../components/legal/LegalParagraph'
import LegalSection from '../components/legal/LegalSection'

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPage
      intro={`${LEGAL_ENTITY.tradeName} s'engage à protéger les données personnelles des utilisateurs de sa plateforme SaaS (auto-écoles, enseignants, secrétariat, élèves et administrateurs). Cette politique décrit les traitements réalisés conformément au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés.`}
      seoKey="politiqueConfidentialite"
      title="Politique de confidentialité"
    >
      <LegalSection id="donnees-collectees" title="Données collectées">
        <LegalParagraph>Nous collectons uniquement les données nécessaires au fonctionnement du service :</LegalParagraph>
        <LegalList
          items={[
            'Identité et coordonnées : nom, prénom, e-mail, téléphone, adresse postale le cas échéant',
            'Données de compte : identifiants, rôle, organisation, historique de connexion',
            'Données pédagogiques : progression REMC, leçons, évaluations, documents de formation',
            'Données administratives : inscriptions, contrats, paiements liés à l\'auto-école cliente',
            'Données techniques : journaux, adresse IP, type de navigateur, cookies (voir politique cookies)',
          ]}
        />
      </LegalSection>

      <LegalSection id="finalites" title="Finalités">
        <LegalList
          items={[
            'Fourniture et amélioration de la plateforme Pedagogia Drive',
            'Gestion des comptes utilisateurs et des droits d\'accès',
            'Suivi pédagogique et communication entre acteurs de l\'auto-école',
            'Support client, sécurité, prévention de la fraude et sauvegardes',
            'Mesure d\'audience du site marketing (avec consentement lorsque requis)',
            'Respect des obligations légales et comptables',
          ]}
        />
      </LegalSection>

      <LegalSection id="base-legale" title="Base légale">
        <LegalList
          items={[
            'Exécution du contrat (CGU/CGV) et des mesures précontractuelles',
            'Intérêt légitime : sécurité, amélioration du service, support',
            'Obligation légale : conservation comptable et réponses aux autorités',
            'Consentement : cookies non essentiels et certaines communications marketing',
          ]}
        />
      </LegalSection>

      <LegalSection id="duree-conservation" title="Durée de conservation">
        <LegalParagraph>
          Les données sont conservées pendant la durée du contrat, puis archivées ou supprimées selon les
          obligations légales applicables. Les comptes inactifs peuvent être supprimés après notification.
          Les journaux techniques sont conservés pour une durée limitée proportionnée aux finalités de
          sécurité.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="destinataires" title="Destinataires">
        <LegalParagraph>
          Les données sont accessibles aux équipes habilitées de {LEGAL_ENTITY.companyName} et, le cas
          échéant, aux sous-traitants suivants :
        </LegalParagraph>
        <LegalList
          items={[
            `${LEGAL_HOSTING.name} — hébergement web`,
            `${LEGAL_DATABASE.provider} — base de données`,
            `${LEGAL_EMAIL_PROVIDER.name} — envoi d'e-mails transactionnels`,
            `${LEGAL_ANALYTICS.provider} — mesure d'audience (site public)`,
          ]}
        />
        <LegalParagraph>Les données ne sont jamais revendues à des tiers.</LegalParagraph>
      </LegalSection>

      <LegalSection id="hebergement" title="Hébergement">
        <LegalParagraph>
          Les données sont hébergées par {LEGAL_DATABASE.provider}, avec des mesures visant le
          stockage en {LEGAL_DATABASE.region}. L&apos;hébergement applicatif est assuré par{' '}
          {LEGAL_HOSTING.name}.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="securite" title="Sécurité">
        <LegalParagraph>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées : chiffrement
          des communications (HTTPS/TLS), contrôle d&apos;accès par rôles (RLS), authentification sécurisée,
          journalisation et sauvegardes. Aucun système n&apos;étant infaillible, nous vous invitons à
          protéger vos identifiants.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies">
        <LegalParagraph>
          L&apos;utilisation des cookies est détaillée dans notre{' '}
          <a className="font-semibold text-cyan-700 hover:text-cyan-800" href="/cookies">
            politique de cookies
          </a>
          .
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="droits" title="Droits des utilisateurs">
        <LegalParagraph>Vous disposez des droits suivants :</LegalParagraph>
        <LegalList
          items={[
            'Droit d\'accès, de rectification et d\'effacement',
            'Droit à la limitation et à l\'opposition',
            'Droit à la portabilité lorsque applicable',
            'Droit de retirer votre consentement à tout moment',
            'Droit d\'introduire une réclamation auprès de la CNIL (www.cnil.fr)',
          ]}
        />
        <LegalParagraph>
          Pour exercer vos droits, contactez-nous à{' '}
          <a className="font-semibold text-cyan-700 hover:text-cyan-800" href={legalMailto(LEGAL_ENTITY.dpoEmail)}>
            {LEGAL_ENTITY.dpoEmail}
          </a>
          .
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="dpo" title="Contact DPO">
        <LegalParagraph>
          Délégué à la protection des données (DPO) ou contact privacy :
        </LegalParagraph>
        <LegalContactBlock email={LEGAL_ENTITY.dpoEmail} label="DPO / Contact privacy" />
        <LegalEntityBlock />
      </LegalSection>
    </LegalPage>
  )
}
