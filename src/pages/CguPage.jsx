import { LEGAL_ENTITY } from '../config/legal'
import LegalList from '../components/legal/LegalList'
import LegalPage from '../components/legal/LegalPage'
import LegalParagraph from '../components/legal/LegalParagraph'
import LegalSection from '../components/legal/LegalSection'

export default function CguPage() {
  return (
    <LegalPage
      intro={`Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme ${LEGAL_ENTITY.tradeName} par les utilisateurs autorisés (gérants, secrétariat, enseignants, élèves et administrateurs).`}
      seoKey="cgu"
      title="Conditions générales d'utilisation"
    >
      <LegalSection id="presentation" title="Présentation">
        <LegalParagraph>
          {LEGAL_ENTITY.tradeName} est une solution SaaS éditée par {LEGAL_ENTITY.companyName}, destinée
          aux auto-écoles pour la gestion pédagogique, administrative et la communication interne.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="acces" title="Accès au service">
        <LegalParagraph>
          L&apos;accès à la plateforme est réservé aux établissements et utilisateurs disposant d&apos;un
          compte actif. L&apos;éditeur peut suspendre l&apos;accès en cas de violation des CGU, de non-paiement
          ou pour maintenance.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="compte" title="Création de compte">
        <LegalParagraph>
          Chaque utilisateur s&apos;engage à fournir des informations exactes et à maintenir la
          confidentialité de ses identifiants. Toute activité réalisée depuis un compte est réputée
          effectuée par son titulaire.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="responsabilites" title="Responsabilités">
        <LegalList
          items={[
            `L'éditeur fournit un service d'hébergement et d'outils ; l'auto-école reste responsable de l'usage pédagogique et du contenu saisi.`,
            'L\'utilisateur s\'interdit tout usage frauduleux, contraire à la loi ou portant atteinte aux droits de tiers.',
            'L\'auto-école est responsable des données qu\'elle collecte auprès de ses élèves et du respect du RGPD dans son établissement.',
          ]}
        />
      </LegalSection>

      <LegalSection id="disponibilite" title="Disponibilité">
        <LegalParagraph>
          {LEGAL_ENTITY.tradeName} est fourni « en l&apos;état ». L&apos;éditeur vise une haute disponibilité
          mais ne garantit pas l&apos;absence d&apos;interruptions (maintenance, incidents, force majeure).
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="pi" title="Propriété intellectuelle">
        <LegalParagraph>
          La plateforme, son code, sa marque et ses contenus éditoriaux restent la propriété de{' '}
          {LEGAL_ENTITY.companyName}. Les contenus importés par l&apos;auto-école restent sa propriété.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="resiliation" title="Résiliation">
        <LegalParagraph>
          L&apos;utilisateur peut demander la clôture de son compte conformément aux CGV. L&apos;éditeur peut
          résilier un accès en cas de manquement grave, après notification lorsque possible.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="modification" title="Modification des CGU">
        <LegalParagraph>
          Les CGU peuvent être mises à jour. Les utilisateurs seront informés en cas de modification
          substantielle. La poursuite de l&apos;utilisation vaut acceptation des nouvelles conditions.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="droit-applicable" title="Droit applicable">
        <LegalParagraph>Les présentes CGU sont soumises au droit français.</LegalParagraph>
      </LegalSection>

      <LegalSection id="tribunal" title="Tribunal compétent">
        <LegalParagraph>
          Sauf disposition légale impérative contraire, tout litige relève de la compétence des tribunaux
          du ressort du siège social de {LEGAL_ENTITY.companyName}, après tentative de résolution amiable.
        </LegalParagraph>
      </LegalSection>
    </LegalPage>
  )
}
