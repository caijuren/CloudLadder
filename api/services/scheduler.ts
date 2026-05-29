import cron from 'node-cron'
import { crawlAll } from './crawler.js'

let task: ReturnType<typeof cron.schedule> | null = null

export function startScheduler(): void {
  if (task) {
    console.log('[Scheduler] Already running')
    return
  }

  task = cron.schedule('0 2 * * *', async () => {
    console.log('[Scheduler] Starting daily crawl at', new Date().toISOString())
    try {
      const results = await crawlAll()
      console.log('[Scheduler] Daily crawl completed:', JSON.stringify(results))
    } catch (error) {
      console.error('[Scheduler] Daily crawl failed:', error)
    }
  }, {
    name: 'daily-crawl',
    timezone: 'Asia/Shanghai',
  })

  console.log('[Scheduler] Started - daily crawl at 02:00 AM (Asia/Shanghai)')
}

export function stopScheduler(): void {
  if (task) {
    task.stop()
    task = null
    console.log('[Scheduler] Stopped')
  }
}