import { useState } from 'react'
import EmptyState from '../../components/ui/EmptyState'

const DAY_SCHEDULES = {
  Lundi: { start: '9h', end: '17h', lunchStart: '12h', lunchEnd: '13h' },
  Mardi: { start: '9h', end: '18h30', lunchStart: '12h30', lunchEnd: '13h30' },
  Mercredi: { start: '10h', end: '17h', lunchStart: '12h', lunchEnd: '13h' },
  Jeudi: { start: '9h', end: '17h30', lunchStart: '12h', lunchEnd: '13h' },
  Vendredi: { start: '9h', end: '15h', lunchStart: '12h', lunchEnd: '13h' },
  Samedi: { start: '9h', end: '13h', lunchStart: null, lunchEnd: null },
}

const weeklyPlans = []

function getTeachingHours(slots) {
  return slots.filter((slot) => slot.type !== 'break').reduce((sum, slot) => sum + slot.duration, 0)
}

function formatDayRangeLabel(day) {
  const schedule = DAY_SCHEDULES[day]
  if (!schedule) return ''
  return schedule.lunchStart
    ? `${schedule.start}–${schedule.end} · pause ${schedule.lunchStart}–${schedule.lunchEnd}`
    : `${schedule.start}–${schedule.end}`
}

const WEEK_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

function groupSlotsByDay(slots) {
  const grouped = new Map()

  slots.forEach((slot) => {
    if (!grouped.has(slot.day)) {
      grouped.set(slot.day, [])
    }
    grouped.get(slot.day).push(slot)
  })

  return WEEK_DAYS.filter((day) => grouped.has(day)).map((day) => ({
    day,
    date: grouped.get(day)[0]?.date || '',
    slots: grouped.get(day),
    hours: getTeachingHours(grouped.get(day)),
    scheduleLabel: formatDayRangeLabel(day),
  }))
}

function PlanningSlotCard({ slot, showDay = true }) {
  const isBreak = slot.type === 'break'

  return (
    <article
      className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        isBreak ? 'border-slate-300 bg-slate-100' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-xl px-3 py-2 text-center ${isBreak ? 'bg-slate-200' : 'bg-slate-50'}`}>
          {showDay && <p className="text-xs font-bold text-slate-400">{slot.day}</p>}
          <p className={`font-black text-slate-900 ${showDay ? 'text-sm' : 'text-base'}`}>{slot.time}</p>
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900">{isBreak ? slot.label : slot.student}</h3>
          <p className="text-sm text-slate-500">
            {formatDateFr(slot.date)}
            {!isBreak && ` · Durée ${slot.duration}h`}
          </p>
          {!isBreak && <p className="text-xs font-bold text-cyan-700">{slot.permit}</p>}
        </div>
      </div>
      <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyles[slot.status]}`}>
        {slot.status}
      </span>
    </article>
  )
}

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
  Pause: 'bg-slate-200 text-slate-600 border-slate-300',
}

export default function TeacherPlanningPage() {
  const [period, setPeriod] = useState('semaine')
  const [weekIndex, setWeekIndex] = useState(0)
  const [selectedDay, setSelectedDay] = useState('Lundi')

  const activeWeek = weeklyPlans[weekIndex]
  const activeSlots = activeWeek?.slots ?? []

  const weeklyTeachingHours = getTeachingHours(activeSlots)
  const slotsToDisplay =
    period === 'jour' ? activeSlots.filter((slot) => slot.day === selectedDay) : activeSlots
  const groupedDays = groupSlotsByDay(slotsToDisplay)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="pd-card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.08),transparent_40%)]" />
        <div className="relative">
          <span className="pd-eyebrow">Mon planning</span>
          <p className="pd-subtitle mt-3 max-w-4xl">Jour, semaine, heures travaillées.</p>
        </div>
      </section>

      <section>
        <MetricCard label="Heures travaillées cette semaine" value={`${weeklyTeachingHours}h`} tone="cyan" />
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Timeline des horaires</h2>
            <p className="mt-1 text-sm font-semibold text-cyan-700">{activeWeek?.label}</p>
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
              className={`rounded-xl px-4 py-2 text-sm font-bold ${period === 'jour' ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700'}`}
            >
              Planning jour
            </button>
            <button
              type="button"
              onClick={() => setPeriod('semaine')}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${period === 'semaine' ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700'}`}
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

        <div className="mt-5 flex flex-col gap-6">
          {slotsToDisplay.length === 0 ? (
            <EmptyState
              title="Aucune leçon programmée"
              message="Aucune leçon programmée pour le moment."
              icon="📅"
            />
          ) : period === 'semaine' ? (
            groupedDays.map((dayGroup, index) => (
              <section key={dayGroup.day} className="flex flex-col gap-3">
                <div
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-4 py-3 ${
                    index > 0 ? 'border-t-4 border-t-blue-400' : ''
                  }`}
                >
                  <div>
                    <p className="text-lg font-extrabold text-slate-900">{dayGroup.day}</p>
                    <p className="text-sm text-slate-600">
                      {formatDateFr(dayGroup.date)} · {dayGroup.hours}h de conduite
                    </p>
                  </div>
                  <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-blue-700">
                    {dayGroup.scheduleLabel}
                  </span>
                </div>
                <div className="grid gap-3 border-l-2 border-blue-200 pl-3 sm:pl-4">
                  {dayGroup.slots.map((slot) => (
                    <PlanningSlotCard key={slot.id} showDay={false} slot={slot} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="grid gap-3">
              {slotsToDisplay.map((slot) => (
                <PlanningSlotCard key={slot.id} slot={slot} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value, tone }) {
  const toneClass = {
    cyan: 'bg-gradient-to-br from-cyan-50 to-white text-cyan-700 border-cyan-200',
    emerald: 'bg-gradient-to-br from-emerald-50 to-white text-emerald-700 border-emerald-200',
    amber: 'bg-gradient-to-br from-amber-50 to-white text-amber-700 border-amber-200',
    sky: 'bg-gradient-to-br from-sky-50 to-white text-sky-700 border-sky-200',
  }[tone]

  return (
    <article className={`rounded-2xl border p-5 shadow-[var(--shadow-soft)] ${toneClass}`}>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </article>
  )
}
