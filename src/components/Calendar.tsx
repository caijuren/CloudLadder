import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  deadlines?: { date: number; title: string }[]
  onMonthChange?: (year: number, month: number) => void
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

export default function Calendar({ deadlines = [], onMonthChange }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [taskDeadlines, setTaskDeadlines] = useState<{ date: number; title: string }[]>([])
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const fetchTaskDeadlines = useCallback(async () => {
    try {
      const { apiFetch } = await import('@/lib/store')
      const json = await apiFetch('/api/workbench/tasks')
      if (json.success && json.data) {
        const deadlinesMap: Record<number, string[]> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        json.data.forEach((task: any) => {
          if (task.deadline) {
            const d = new Date(task.deadline)
            if (d.getFullYear() === year && d.getMonth() === month) {
              const day = d.getDate()
              if (!deadlinesMap[day]) deadlinesMap[day] = []
              deadlinesMap[day].push(task.title)
            }
          }
        })
        const list = Object.entries(deadlinesMap).map(([date, titles]) => ({
          date: Number(date),
          title: titles.join('、'),
        }))
        setTaskDeadlines(list)
      }
    } catch {
      // ignore fetch error
    }
  }, [year, month])

  useEffect(() => {
    if (deadlines.length > 0) {
      setTaskDeadlines(deadlines)
    } else {
      fetchTaskDeadlines()
    }
  }, [deadlines, year, month, fetchTaskDeadlines])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const currentDate = today.getDate()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  const hasDeadline = (day: number) => taskDeadlines.some((d) => d.date === day)
  const getDeadlineTitle = (day: number) => taskDeadlines.find((d) => d.date === day)?.title

  const prevMonth = () => {
    const newMonth = month - 1
    if (newMonth < 0) {
      setYear(year - 1)
      setMonth(11)
    } else {
      setMonth(newMonth)
    }
    setSelectedDay(null)
    if (onMonthChange) onMonthChange(newMonth < 0 ? year - 1 : year, newMonth < 0 ? 11 : newMonth)
  }

  const nextMonth = () => {
    const newMonth = month + 1
    if (newMonth > 11) {
      setYear(year + 1)
      setMonth(0)
    } else {
      setMonth(newMonth)
    }
    setSelectedDay(null)
    if (onMonthChange) onMonthChange(newMonth > 11 ? year + 1 : year, newMonth > 11 ? 0 : newMonth)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded transition-colors">
          <ChevronLeft size={16} className="text-gray-500" />
        </button>
        <span className="text-sm font-medium text-gray-700">{year}年{month + 1}月</span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded transition-colors">
          <ChevronRight size={16} className="text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {weekDays.map((d) => (
          <div key={d} className="text-xs text-gray-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isToday = isCurrentMonth && day === currentDate
          const hasEvent = hasDeadline(day)
          const isSelected = selectedDay === day

          return (
            <div
              key={day}
              onClick={() => {
                setSelectedDay(isSelected ? null : day)
              }}
              className={cn(
                'text-xs py-1.5 rounded-full relative cursor-pointer select-none transition-colors',
                isToday && 'bg-primary text-white font-medium',
                isSelected && !isToday && 'ring-2 ring-primary bg-primary/5',
                !isToday && !isSelected && 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {day}
              {hasEvent && !isToday && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
              )}
              {hasEvent && isToday && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </div>
          )
        })}
      </div>

      {selectedDay && (
        <div className="mt-3 p-3 bg-accent/5 rounded-lg border border-accent/10">
          <p className="text-xs font-medium text-gray-700 mb-1">{month + 1}月{selectedDay}日</p>
          {hasDeadline(selectedDay) ? (
            <p className="text-xs text-accent">{getDeadlineTitle(selectedDay)}</p>
          ) : (
            <p className="text-xs text-gray-400">暂无任务截止</p>
          )}
        </div>
      )}

      {taskDeadlines.length > 0 && !selectedDay && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs text-gray-400 font-medium">本月截止任务</p>
          {taskDeadlines.slice(0, 3).map((event, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-primary font-medium">{event.date}日</span>
              <span className="truncate">{event.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}