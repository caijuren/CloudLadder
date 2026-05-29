import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { initDb } from './db.js'
import { startScheduler } from './services/scheduler.js'
import authRoutes from './routes/auth.js'
import policyRoutes from './routes/policies.js'
import companyRoutes from './routes/company.js'
import matchingRoutes from './routes/matching.js'
import workbenchRoutes from './routes/workbench.js'
import adminRoutes from './routes/admin.js'
import policyParseRoutes from './routes/policyParse.js'
import crawlerRoutes from './routes/crawler.js'
import subscriptionRoutes from './routes/subscriptions.js'
import uploadRoutes from './routes/upload.js'
import linksRoutes from './routes/links.js'
import docCategoryRoutes from './routes/docCategories.js'

dotenv.config()

initDb()
startScheduler()

const app: express.Application = express()

app.set('trust proxy', 1)

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setTimeout(30000, () => {
    res.status(503).json({
      success: false,
      message: '请求超时',
    })
  })
  next()
})

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')))
app.use(express.static(path.resolve(process.cwd(), 'dist')))

app.use('/api/auth', authRoutes)
app.use('/api/policies', policyParseRoutes)
app.use('/api/policies', policyRoutes)
app.use('/api/company', companyRoutes)
app.use('/api/matching', matchingRoutes)
app.use('/api/workbench', workbenchRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/crawler', crawlerRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/links', linksRoutes)
app.use('/api/company/doc-categories', docCategoryRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] Unhandled error on ${req.method} ${req.path}:`, error.message)
  console.error(error.stack)
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
  })
})

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'))
})

export default app