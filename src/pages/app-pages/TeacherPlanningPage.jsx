import { useMemo, useState } from 'react'
import { useStudentTrackingStore } from '../../data/studentTrackingStore'

const weeklyPlans = [
  {
    id: 'week-21',
    label: 'Semaine du 20 au 26 mai 2026',
    slots: [
      { id: 'slot-1', day: 'Lundi', date: '2026-05-20', time: '09:00', duration: 3, student: 'Thomas Martin', permit: 'Permis B · Boîte manuelle', status: 'Terminé' },
      { id: 'slot-2', day: 'Lundi', date: '2026-05-20', time: '13:00', duration: 5, student: 'Camille Leroy', permit: 'AAC', status: 'Terminé' },
      { id: 'slot-3', day: 'Mardi', date: '2026-05-21', time: '09:00', duration: 2, student: 'Inès Meyer', permit: 'Permis B · Boîte manuelle', status: 'En cours' },
      { id: 'slot-4', day: 'Mercredi', date: '2026-05-22', time: '14:00', duration: 2, student: 'Yanis Roux', permit: 'Conduite supervisée', status: 'À venir' },
      { id: 'slot-5', day: 'Jeudi', date: '2026-05-23', time: '16:00', duration: 2, student: 'Nora Faure', permit: 'Permis B · Boîte automatique', status: 'À venir' },
    ],
  },
  {
    id: 'week-22',
    label: 'Semaine du 27 mai au 2 juin 2026',
    slots: [
      { id: 'slot-6', day: 'Lundi', date: '2026-05-27', time: '09:00', duration: 2, student: 'Lina Bernard', permit: 'Permis B · Boîte automatique', status: 'À venir' },
      { id: 'slot-7', day: 'Mardi', date: '2026-05-28', time: '11:00', duration: 2, student: 'Thomas Martin', permit: 'Permis B · Boîte manuelle', status: 'À venir' },
      { id: 'slot-8', day: 'Mercredi', date: '2026-05-29', time: '15:00', duration: 2, student: 'Camille Leroy', permit: 'AAC', status: 'À venir' },
      { id: 'slot-9', day: 'Jeudi', date: '2026-05-30', time: '10:00', duration: 2, student: 'Inès Meyer', permit: 'Permis B · Boîte manuelle', status: 'À venir' },
      { id: 'slot-10', day: 'Samedi', date: '2026-06-01', time: '09:30', duration: 2, student: 'Lina Bernard', permit: 'Permis B · Boîte automatique', status: 'À venir' },
    ],
  },
]

function formatDateFr(dateString) {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-')
  if (!year || !month || !day) return dateString
  return `${day}/${month}/${year}`
}

const statusStyles = {
  Terminé: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'En cours': 'bg-amber-50 text-amber-700 border-amber-200',
  'À venir': 'bg-cyan-50 text-cyan-700 border-cyan-200',
}

export default function TeacherPlanningPage() {
  const { students } = useStudentTrackingStore()
  const [period, setPeriod] = useState('jour')
  const [weekIndex, setWeekIndex] = useState(0)
  const [selectedDay, setSelectedDay] = useState('Lundi')

  const activeWeek = weeklyPlans[weekIndex]
  const activeSlots = activeWeek.slots

  const lessonHoursFromHistory = useMemo(
    () =>
      students.reduce((sum, student) => {
        return (
          sum +
          (student.lessonHistory || []).reduce((inner, lesson) => {
            const numeric = Number.parseFloat(String(lesson.duration || '').replace('h', '').replace(',', '.'))
            return inner + (Number.isNaN(numeric) ? 0 : numeric)
          }, 0)
        )
      }, 0),
    [students],
  )

  const plannedHours = activeSlots.reduce((sum, slot) => sum + slot.duration, 0)
  const slotsToDisplay =
    period === 'jour' ? activeSlots.filter((slot) => slot.day === selectedDay) : activeSlots
  const totalWeekHours = Math.round((lessonHoursFromHistory + plannedHours) * 10) / 10
  const workedDayRanges = '9H–12H · 13H–18H'

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-6 text-white shadow-[var(--shadow-card)] md:p-8">
        <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-sm font-semibold text-cyan-100">
          Mon planning
        </p>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Planning terrain enseignant</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-cyan-50/85">Jour, semaine, heures travaillées.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <MetricCard label="Heures travaillées cette semaine" value={`${totalWeekHours}h`} tone="cyan" />
        <MetricCard label="Heures de la journée travaillée" value={workedDayRanges} tone="emerald" />
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Timeline des horaires</h2>
            <p className="mt-1 text-sm font-semibold text-cyan-700">{activeWeek.label}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setWeekIndex((current) => Math.max(0, current - 1))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600"
              disabled={weekIndex === 0}
            >
              Semaine précédente
            </button>
            <button
              type="button"
              onClick={() => setWeekIndex((current) => Math.min(weeklyPlans.length - 1, current + 1))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600"
              disabled={weekIndex === weeklyPlans.length - 1}
            >
              Semaine suivante
            </button>
            <button
              type="button"
              onClick={() => setPeriod('jour')}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${period === 'jour' ? 'bg-navy-950 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Planning jour
            </button>
            <button
              type="button"
              onClick={() => setPeriod('semaine')}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${period === 'semaine' ? 'bg-navy-950 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Planning semaine
            </button>
            {period === 'jour' && (
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                value={selectedDay}
                onChange={(event) => setSelectedDay(event.target.value)}
              >
                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {slotsToDisplay.map((slot) => (
            <article key={slot.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white px-3 py-2 text-center">
                  <p className="text-xs font-bold text-slate-400">{slot.day}</p>
                  <p className="text-sm font-black text-slate-900">{slot.time}</p>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900">{slot.student}</h3>
                  <p className="text-sm text-slate-500">
                    {formatDateFr(slot.date)} · Durée {slot.duration}h
                  </p>
                  <p className="text-xs font-bold text-cyan-700">{slot.permit}</p>
                </div>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyles[slot.status]}`}>
                {slot.status}
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value, tone }) {
  const toneClass = {
    cyan: 'from-cyan-50 to-white text-cyan-700 border-cyan-200',
    emerald: 'from-emerald-50 to-white text-emerald-700 border-emerald-200',
    amber: 'from-amber-50 to-white text-amber-700 border-amber-200',
    sky: 'from-sky-50 to-white text-sky-700 border-sky-200',
  }[tone]

  return (
    <article className={`rounded-2xl border bg-gradient-to-br p-5 shadow-[var(--shadow-soft)] ${toneClass}`}>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </article>
  )
}
