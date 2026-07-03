#!/usr/bin/env node
/**
 * Enrichit les données recette : conversations, documents metadata, messages.
 * Usage: node scripts/seed-preprod-enrich.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { RECETTE_ORG_PREFIX, requireSupabaseAdmin } from './lib/recette-seed-utils.mjs'

const TARGET_CONVERSATIONS = 1000
const TARGET_DOCUMENTS = 200

async function main() {
  const { url, serviceKey } = requireSupabaseAdmin()
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: orgs } = await admin.from('organizations').select('id, name').like('name', `${RECETTE_ORG_PREFIX}%`)
  if (!orgs?.length) throw new Error('Aucune org recette — lancez seed-recette-data.mjs d\'abord.')

  let convCount = 0
  let docCount = 0
  let msgCount = 0

  const { count: existingConv } = await admin.from('conversations').select('id', { count: 'exact', head: true })
  const toCreate = Math.max(0, TARGET_CONVERSATIONS - (existingConv || 0))

  console.log(`Enrichissement : ${toCreate} conversations cible, ${TARGET_DOCUMENTS} documents`)

  for (const org of orgs) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, role')
      .eq('organization_id', org.id)
      .in('role', ['manager', 'secretary', 'teacher'])

    const manager = profiles?.find((p) => p.role === 'manager')
    const secretary = profiles?.find((p) => p.role === 'secretary')
    const teachers = profiles?.filter((p) => p.role === 'teacher') || []
    const { data: students } = await admin.from('students').select('id, profile_id').eq('organization_id', org.id).limit(10)

    if (!manager || !students?.length) continue

    const pairs = [
      [manager, secretary],
      [manager, teachers[0]],
      [secretary, teachers[0]],
      [teachers[0], { id: students[0].profile_id }],
    ].filter(([a, b]) => a && b)

    for (const [a, b] of pairs) {
      if (convCount >= toCreate) break

      const { data: conv, error } = await admin.from('conversations').insert({
        organization_id: org.id,
        kind: 'internal',
        subject: `Recette préprod — ${org.name.slice(0, 30)}`,
        created_by: a.id,
        last_message_at: new Date().toISOString(),
      }).select('id').single()

      if (error || !conv) continue

      for (const pid of [a.id, b.id]) {
        await admin.from('conversation_participants').insert({ conversation_id: conv.id, profile_id: pid })
      }

      for (let m = 0; m < 2; m += 1) {
        await admin.from('messages').insert({
          conversation_id: conv.id,
          organization_id: org.id,
          sender_id: m === 0 ? a.id : b.id,
          body: `Message recette préprod #${m + 1} — ${new Date().toISOString()}`,
        })
        msgCount += 1
      }
      convCount += 1
    }

    for (const student of (students || []).slice(0, 2)) {
      if (docCount >= TARGET_DOCUMENTS) break
      const { error } = await admin.from('documents').insert({
        organization_id: org.id,
        student_id: student.id,
        type: 'Attestation',
        file_name: 'Attestation recette.pdf',
        folder: 'Administratif',
        storage_path: `${student.id}/recette-attestation.pdf`,
        status: 'Validé',
        comment: 'Document recette préprod',
      })
      if (!error) docCount += 1
    }
  }

  console.log(`✓ ${convCount} conversations · ${msgCount} messages · ${docCount} documents metadata`)
}

main().catch((e) => { console.error(e); process.exit(1) })
