'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FiArrowRight,
  FiTrendingUp,
  FiTarget,
  FiBookOpen,
  FiClock,
  FiDollarSign,
  FiAward,
  FiStar,
  FiCheckCircle,
  FiBarChart2,
  FiRefreshCw,
} from 'react-icons/fi'
import { Loader2 } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface SalaryRange {
  entry_level: string
  mid_level: string
  senior_level: string
  currency: string
}

interface Course {
  name: string
  provider: string
  cost: string
  duration: string
  format?: string
  order?: number
}

interface SkillGap {
  skill_name: string
  importance: string
  current_level: string
  required_level: string
  gap_severity: string
  learning_priority: number
}

interface MarketResearch {
  salary_range: SalaryRange
  demand_level: string
  demand_description: string
  trending_skills: string[]
  recommended_courses: Course[]
  employer_preferences: string[]
  market_summary: string
}

interface SkillGapAnalysis {
  target_role_competencies: string[]
  existing_strengths: string[]
  skill_gaps: SkillGap[]
  recommended_learning_order: string[]
  gap_summary: string
}

interface Pathway {
  pathway_title: string
  strategy_type: string
  is_recommended: boolean
  courses: Course[]
  total_cost: string
  total_duration: string
  projected_salary_increase: string
  time_to_first_impact: string
  roi_score: string
  pros: string[]
  cons: string[]
}

interface Verdict {
  recommended_pathway: string
  reasoning: string
  next_steps: string[]
}

interface PathwayStrategy {
  pathways: Pathway[]
  verdict: Verdict
}

interface AdvisoryReport {
  market_research: MarketResearch
  skill_gap_analysis: SkillGapAnalysis
  pathway_strategy: PathwayStrategy
}

interface FormData {
  currentDegree: string
  targetRole: string
  monthlyBudget: string
  weeklyHours: number
  learningStyle: string
}

type AppScreen = 'input' | 'loading' | 'results'

const MANAGER_AGENT_ID = '699963421b86f70befdb2401'

// ── Sample Data ────────────────────────────────────────────────────────────

const SAMPLE_FORM: FormData = {
  currentDegree: 'B.Sc. Computer Science',
  targetRole: 'Senior Data Engineer at FAANG',
  monthlyBudget: '250',
  weeklyHours: 15,
  learningStyle: 'mixed',
}

const SAMPLE_REPORT: AdvisoryReport = {
  market_research: {
    salary_range: {
      entry_level: '$85,000 - $110,000',
      mid_level: '$120,000 - $160,000',
      senior_level: '$170,000 - $230,000',
      currency: 'USD',
    },
    demand_level: 'Very High',
    demand_description: 'Data Engineering roles have seen a 42% increase in demand over the past 12 months, with FAANG companies leading hiring.',
    trending_skills: ['Apache Spark', 'dbt', 'Snowflake', 'Kubernetes', 'Apache Kafka', 'Terraform'],
    recommended_courses: [
      { name: 'Data Engineering with Python', provider: 'DataCamp', cost: '$25/mo', duration: '4 months', format: 'Video + Hands-on' },
      { name: 'Apache Spark Specialization', provider: 'Coursera', cost: '$49/mo', duration: '3 months', format: 'Video Courses' },
      { name: 'Cloud Data Engineering', provider: 'Udacity', cost: '$399/mo', duration: '4 months', format: 'Project-based' },
    ],
    employer_preferences: ['Strong SQL skills', 'Cloud platform experience (AWS/GCP)', 'CI/CD pipeline knowledge', 'Data modeling expertise', 'Communication skills'],
    market_summary: 'The data engineering market is experiencing unprecedented growth. Companies are investing heavily in data infrastructure, creating strong demand for skilled professionals who can build and maintain scalable data pipelines.',
  },
  skill_gap_analysis: {
    target_role_competencies: ['Distributed Systems', 'Data Modeling', 'ETL/ELT Pipelines', 'Cloud Platforms', 'SQL Optimization', 'Python/Scala', 'Data Governance'],
    existing_strengths: ['Python Programming', 'SQL Fundamentals', 'Basic Statistics', 'Git Version Control'],
    skill_gaps: [
      { skill_name: 'Apache Spark', importance: 'Critical', current_level: 'Beginner', required_level: 'Advanced', gap_severity: 'High', learning_priority: 1 },
      { skill_name: 'Cloud Platforms (AWS/GCP)', importance: 'Critical', current_level: 'Beginner', required_level: 'Intermediate', gap_severity: 'High', learning_priority: 2 },
      { skill_name: 'Data Modeling', importance: 'High', current_level: 'Intermediate', required_level: 'Advanced', gap_severity: 'Medium', learning_priority: 3 },
      { skill_name: 'Kubernetes/Docker', importance: 'Medium', current_level: 'Beginner', required_level: 'Intermediate', gap_severity: 'Medium', learning_priority: 4 },
      { skill_name: 'Kafka/Streaming', importance: 'Medium', current_level: 'None', required_level: 'Intermediate', gap_severity: 'High', learning_priority: 5 },
    ],
    recommended_learning_order: ['Cloud Platforms', 'Apache Spark', 'Data Modeling', 'Kubernetes/Docker', 'Kafka/Streaming'],
    gap_summary: 'You have a solid foundation in Python and SQL. The primary gaps are in distributed computing (Spark), cloud infrastructure, and real-time data processing. Closing these gaps will position you competitively for senior data engineering roles.',
  },
  pathway_strategy: {
    pathways: [
      {
        pathway_title: 'Accelerated Intensive',
        strategy_type: 'Fast Track',
        is_recommended: true,
        courses: [
          { name: 'Cloud Data Engineering Nanodegree', provider: 'Udacity', cost: '$399/mo', duration: '4 months', order: 1 },
          { name: 'Apache Spark Specialization', provider: 'Coursera', cost: '$49/mo', duration: '3 months', order: 2 },
          { name: 'Kafka Streams in Practice', provider: 'Confluent', cost: '$0', duration: '2 months', order: 3 },
        ],
        total_cost: '$1,743',
        total_duration: '9 months',
        projected_salary_increase: '35-50%',
        time_to_first_impact: '3-4 months',
        roi_score: '9.2/10',
        pros: ['Fastest path to job readiness', 'Project-based learning builds portfolio', 'Industry-recognized credentials'],
        cons: ['Higher monthly cost', 'Requires 15+ hours/week commitment', 'Intensive pace may cause burnout'],
      },
      {
        pathway_title: 'Balanced Growth',
        strategy_type: 'Steady Progress',
        is_recommended: false,
        courses: [
          { name: 'Data Engineering with Python', provider: 'DataCamp', cost: '$25/mo', duration: '4 months', order: 1 },
          { name: 'GCP Data Engineering', provider: 'Google Cloud', cost: '$49/mo', duration: '3 months', order: 2 },
          { name: 'dbt Fundamentals', provider: 'dbt Labs', cost: '$0', duration: '1 month', order: 3 },
          { name: 'Spark & Scala', provider: 'Udemy', cost: '$14.99', duration: '3 months', order: 4 },
        ],
        total_cost: '$362',
        total_duration: '11 months',
        projected_salary_increase: '25-40%',
        time_to_first_impact: '4-5 months',
        roi_score: '8.5/10',
        pros: ['Budget-friendly', 'Sustainable pace', 'Broader skill coverage'],
        cons: ['Slower time to market', 'Less project-based', 'May need supplemental practice'],
      },
    ],
    verdict: {
      recommended_pathway: 'Accelerated Intensive',
      reasoning: 'Given your budget of $250/month and 15 hours/week availability, the Accelerated Intensive pathway offers the best return on investment. The project-based approach will build a strong portfolio, and the 9-month timeline aligns with current market demand cycles.',
      next_steps: [
        'Enroll in the Cloud Data Engineering Nanodegree within the next week',
        'Set up a GitHub portfolio for showcasing projects',
        'Join data engineering communities on Discord and LinkedIn',
        'Begin practicing SQL optimization problems on LeetCode',
        'Schedule monthly progress reviews to stay on track',
      ],
    },
  },
}

// ── Parsing Utility ────────────────────────────────────────────────────────

function parseAgentResponse(result: any): AdvisoryReport | null {
  try {
    let data = result?.response?.result
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch {
        const jsonMatch = data.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0])
        }
      }
    }
    if (data && data.market_research && data.skill_gap_analysis && data.pathway_strategy) {
      return data as AdvisoryReport
    }
    if (result?.response && result.response.market_research) {
      return result.response as AdvisoryReport
    }
    if (result?.raw_response) {
      const rawData = typeof result.raw_response === 'string' ? JSON.parse(result.raw_response) : result.raw_response
      if (rawData.market_research) return rawData as AdvisoryReport
    }
    return null
  } catch (e) {
    console.error('Failed to parse agent response:', e)
    return null
  }
}

// ── Markdown Renderer ──────────────────────────────────────────────────────

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-3 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm leading-relaxed">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// ── Severity / Level Helpers ───────────────────────────────────────────────

function getSeverityColor(severity: string): string {
  const s = (severity ?? '').toLowerCase()
  if (s === 'high' || s === 'critical') return 'bg-red-100 text-red-800 border-red-200'
  if (s === 'medium') return 'bg-amber-100 text-amber-800 border-amber-200'
  if (s === 'low') return 'bg-green-100 text-green-800 border-green-200'
  return 'bg-secondary text-secondary-foreground border-border'
}

function getLevelPercent(level: string): number {
  const l = (level ?? '').toLowerCase()
  if (l === 'none') return 0
  if (l === 'beginner') return 25
  if (l === 'intermediate') return 50
  if (l === 'advanced') return 75
  if (l === 'expert') return 100
  return 30
}

function getDemandColor(demand: string): string {
  const d = (demand ?? '').toLowerCase()
  if (d.includes('very high')) return 'bg-green-600 text-white'
  if (d.includes('high')) return 'bg-green-500 text-white'
  if (d.includes('medium')) return 'bg-amber-500 text-white'
  return 'bg-secondary text-secondary-foreground'
}

// ── Loading Messages ───────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  'Analyzing market trends...',
  'Identifying skill gaps...',
  'Building personalized pathways...',
  'Calculating ROI projections...',
  'Evaluating course options...',
  'Finalizing recommendations...',
]

// ── ErrorBoundary ──────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Sub-Components ─────────────────────────────────────────────────────────

function HeroSection({ onScrollToForm }: { onScrollToForm: () => void }) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://asset.lyzr.app/cXGYqQbs"
          alt=""
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight mb-4">
          Skill Investment Advisor
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
          Invest in the right skills. Maximize your career ROI.
        </p>
        <Button
          onClick={onScrollToForm}
          className="px-8 py-3 text-base font-medium"
          size="lg"
        >
          Get Started <FiArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ProfileSummaryBar({
  formData,
  onEdit,
}: {
  formData: FormData
  onEdit: () => void
}) {
  const styleLabels: Record<string, string> = {
    video: 'Video Courses',
    reading: 'Reading/Text',
    handson: 'Hands-on Projects',
    mixed: 'Mixed',
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-sans text-xs">
              <FiAward className="mr-1 h-3 w-3" />
              {formData.currentDegree}
            </Badge>
            <Badge variant="outline" className="font-sans text-xs">
              <FiTarget className="mr-1 h-3 w-3" />
              {formData.targetRole}
            </Badge>
            <Badge variant="outline" className="font-sans text-xs">
              <FiDollarSign className="mr-1 h-3 w-3" />
              ${formData.monthlyBudget}/mo
            </Badge>
            <Badge variant="outline" className="font-sans text-xs">
              <FiClock className="mr-1 h-3 w-3" />
              {formData.weeklyHours}h/week
            </Badge>
            <Badge variant="outline" className="font-sans text-xs">
              <FiBookOpen className="mr-1 h-3 w-3" />
              {styleLabels[formData.learningStyle] ?? formData.learningStyle}
            </Badge>
          </div>
          <button
            onClick={onEdit}
            className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
          >
            <FiRefreshCw className="h-3 w-3" /> Edit Profile
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

function MarketSnapshotCard({ market }: { market: MarketResearch }) {
  const salary = market?.salary_range
  const currency = salary?.currency ?? 'USD'

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <FiTrendingUp className="h-5 w-5 text-primary" />
          Market Snapshot
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Current market conditions for your target role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Salary Range */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Salary Range ({currency})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Entry Level</p>
              <p className="font-semibold text-sm text-foreground">{salary?.entry_level ?? 'N/A'}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Mid Level</p>
              <p className="font-semibold text-sm text-foreground">{salary?.mid_level ?? 'N/A'}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Senior Level</p>
              <p className="font-semibold text-sm text-foreground">{salary?.senior_level ?? 'N/A'}</p>
            </div>
          </div>
        </div>

        <Separator className="bg-border/30" />

        {/* Demand Level */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Market Demand</span>
          <Badge className={getDemandColor(market?.demand_level ?? '')}>
            {market?.demand_level ?? 'Unknown'}
          </Badge>
        </div>
        {market?.demand_description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{market.demand_description}</p>
        )}

        <Separator className="bg-border/30" />

        {/* Trending Skills */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Trending Skills</h4>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(market?.trending_skills) &&
              market.trending_skills.map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal">
                  {skill}
                </Badge>
              ))}
          </div>
        </div>

        <Separator className="bg-border/30" />

        {/* Employer Preferences */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Employer Preferences</h4>
          <ul className="space-y-1">
            {Array.isArray(market?.employer_preferences) &&
              market.employer_preferences.map((pref, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <FiCheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{pref}</span>
                </li>
              ))}
          </ul>
        </div>

        {/* Market Summary */}
        {market?.market_summary && (
          <>
            <Separator className="bg-border/30" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Market Summary</h4>
              {renderMarkdown(market.market_summary)}
            </div>
          </>
        )}

        {/* Recommended Courses */}
        {Array.isArray(market?.recommended_courses) && market.recommended_courses.length > 0 && (
          <>
            <Separator className="bg-border/30" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Recommended Courses</h4>
              <div className="space-y-2">
                {market.recommended_courses.map((course, i) => (
                  <div key={i} className="bg-secondary/30 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{course?.name ?? 'Untitled'}</p>
                      <p className="text-xs text-muted-foreground">{course?.provider ?? ''}{course?.format ? ` -- ${course.format}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><FiDollarSign className="h-3 w-3" />{course?.cost ?? 'Free'}</span>
                      <span className="flex items-center gap-1"><FiClock className="h-3 w-3" />{course?.duration ?? 'Self-paced'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function SkillGapCard({ analysis }: { analysis: SkillGapAnalysis }) {
  const gaps = Array.isArray(analysis?.skill_gaps) ? analysis.skill_gaps : []
  const strengths = Array.isArray(analysis?.existing_strengths) ? analysis.existing_strengths : []
  const competencies = Array.isArray(analysis?.target_role_competencies) ? analysis.target_role_competencies : []
  const learningOrder = Array.isArray(analysis?.recommended_learning_order) ? analysis.recommended_learning_order : []

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <FiTarget className="h-5 w-5 text-primary" />
          Skill Gap Analysis
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Where you stand and what you need to learn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Existing Strengths */}
        {strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Your Strengths</h4>
            <div className="flex flex-wrap gap-2">
              {strengths.map((s, i) => (
                <Badge key={i} className="bg-green-100 text-green-800 border-green-200 text-xs font-normal">
                  <FiCheckCircle className="mr-1 h-3 w-3" /> {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Target Competencies */}
        {competencies.length > 0 && (
          <>
            <Separator className="bg-border/30" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Target Role Competencies</h4>
              <div className="flex flex-wrap gap-2">
                {competencies.map((c, i) => (
                  <Badge key={i} variant="outline" className="text-xs font-normal">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Skill Gaps */}
        {gaps.length > 0 && (
          <>
            <Separator className="bg-border/30" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Skill Gaps (Prioritized)</h4>
              <div className="space-y-4">
                {gaps
                  .sort((a, b) => (a?.learning_priority ?? 99) - (b?.learning_priority ?? 99))
                  .map((gap, i) => (
                    <div key={i} className="bg-secondary/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                            {gap?.learning_priority ?? i + 1}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{gap?.skill_name ?? 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${getSeverityColor(gap?.gap_severity ?? '')}`}>
                            {gap?.gap_severity ?? 'Unknown'} Gap
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getSeverityColor(gap?.importance ?? '')}`}>
                            {gap?.importance ?? 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Current: {gap?.current_level ?? 'None'}</span>
                          <span>Required: {gap?.required_level ?? 'Unknown'}</span>
                        </div>
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-primary/40 rounded-full"
                            style={{ width: `${getLevelPercent(gap?.required_level ?? '')}%` }}
                          />
                          <div
                            className="absolute inset-y-0 left-0 bg-primary rounded-full"
                            style={{ width: `${getLevelPercent(gap?.current_level ?? '')}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Recommended Learning Order */}
        {learningOrder.length > 0 && (
          <>
            <Separator className="bg-border/30" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Recommended Learning Order</h4>
              <div className="flex flex-wrap items-center gap-1">
                {learningOrder.map((item, i) => (
                  <React.Fragment key={i}>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {i + 1}. {item}
                    </Badge>
                    {i < learningOrder.length - 1 && (
                      <FiArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Gap Summary */}
        {analysis?.gap_summary && (
          <>
            <Separator className="bg-border/30" />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Summary</h4>
              {renderMarkdown(analysis.gap_summary)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function PathwayCard({ pathway, isHighlighted }: { pathway: Pathway; isHighlighted: boolean }) {
  const courses = Array.isArray(pathway?.courses) ? pathway.courses : []
  const pros = Array.isArray(pathway?.pros) ? pathway.pros : []
  const cons = Array.isArray(pathway?.cons) ? pathway.cons : []

  return (
    <Card className={`border-border/50 shadow-sm transition-all duration-200 ${isHighlighted ? 'ring-2 ring-accent border-accent/50 shadow-md' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="font-serif text-lg">{pathway?.pathway_title ?? 'Pathway'}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {pathway?.strategy_type ?? ''}
            </CardDescription>
          </div>
          {pathway?.is_recommended && (
            <Badge className="bg-accent text-accent-foreground text-xs shrink-0">
              <FiStar className="mr-1 h-3 w-3" /> Top Pick
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-secondary/40 rounded-lg p-3 text-center">
            <FiDollarSign className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-sm font-semibold text-foreground">{pathway?.total_cost ?? 'N/A'}</p>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 text-center">
            <FiClock className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-sm font-semibold text-foreground">{pathway?.total_duration ?? 'N/A'}</p>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 text-center">
            <FiTrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Salary Increase</p>
            <p className="text-sm font-semibold text-foreground">{pathway?.projected_salary_increase ?? 'N/A'}</p>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 text-center">
            <FiBarChart2 className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">ROI Score</p>
            <p className="text-sm font-semibold text-foreground">{pathway?.roi_score ?? 'N/A'}</p>
          </div>
        </div>

        {/* Time to Impact */}
        {pathway?.time_to_first_impact && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FiClock className="h-4 w-4 text-primary" />
            <span>Time to first impact: <strong className="text-foreground">{pathway.time_to_first_impact}</strong></span>
          </div>
        )}

        {/* Accordion for detailed breakdown */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="courses" className="border-border/30">
            <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
              <span className="flex items-center gap-2">
                <FiBookOpen className="h-4 w-4" /> Course Sequence ({courses.length} courses)
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-1">
                {courses
                  .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
                  .map((course, i) => (
                    <div key={i} className="flex items-start gap-3 bg-secondary/20 rounded-lg p-3">
                      <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                        {course?.order ?? i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{course?.name ?? 'Untitled'}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{course?.provider ?? ''}</span>
                          <span className="flex items-center gap-1"><FiDollarSign className="h-3 w-3" />{course?.cost ?? 'Free'}</span>
                          <span className="flex items-center gap-1"><FiClock className="h-3 w-3" />{course?.duration ?? 'Self-paced'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tradeoffs" className="border-border/30">
            <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
              <span className="flex items-center gap-2">
                <FiBarChart2 className="h-4 w-4" /> Trade-off Analysis
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <h5 className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Pros</h5>
                  <ul className="space-y-1">
                    {pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <FiCheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-red-700 mb-2 uppercase tracking-wide">Cons</h5>
                  <ul className="space-y-1">
                    {cons.map((con, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0 flex items-center justify-center text-xs font-bold">-</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

function VerdictCard({ verdict }: { verdict: Verdict }) {
  const nextSteps = Array.isArray(verdict?.next_steps) ? verdict.next_steps : []

  return (
    <Card className="border-accent/40 shadow-md bg-gradient-to-br from-card to-secondary/30">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <FiAward className="h-5 w-5 text-accent" />
          Final Verdict
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground mb-1">Recommended Pathway</p>
          <p className="text-lg font-serif font-bold text-accent">{verdict?.recommended_pathway ?? 'N/A'}</p>
        </div>

        {verdict?.reasoning && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Reasoning</h4>
            {renderMarkdown(verdict.reasoning)}
          </div>
        )}

        {nextSteps.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Next Steps</h4>
            <div className="space-y-2">
              {nextSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xs font-bold bg-accent text-accent-foreground rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AgentStatusPanel({ activeAgentId, loading }: { activeAgentId: string | null; loading: boolean }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Agent Status</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">Skill Advisory Coordinator</span>
            <div className="flex items-center gap-2">
              {loading && activeAgentId === MANAGER_AGENT_ID ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-accent" />
                  <span className="text-xs text-accent">Processing</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">Ready</span>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Manager agent that coordinates Market Research, Skill Gap Analysis, and Pathway Strategy sub-agents to deliver comprehensive career recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Page() {
  const [screen, setScreen] = useState<AppScreen>('input')
  const [formData, setFormData] = useState<FormData>({
    currentDegree: '',
    targetRole: '',
    monthlyBudget: '',
    weeklyHours: 10,
    learningStyle: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [report, setReport] = useState<AdvisoryReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sampleMode, setSampleMode] = useState(false)

  const formRef = React.useRef<HTMLDivElement>(null)

  // Loading message cycling
  useEffect(() => {
    if (screen !== 'loading') return
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [screen])

  // Loading progress bar
  useEffect(() => {
    if (screen !== 'loading') return
    setLoadingProgress(0)
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 8
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [screen])

  // Sample data toggle
  useEffect(() => {
    if (sampleMode) {
      setFormData(SAMPLE_FORM)
      setReport(SAMPLE_REPORT)
    } else {
      setFormData({ currentDegree: '', targetRole: '', monthlyBudget: '', weeklyHours: 10, learningStyle: '' })
      setReport(null)
      setScreen('input')
      setErrorMsg(null)
    }
  }, [sampleMode])

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.currentDegree.trim()) newErrors.currentDegree = 'Please enter your current degree or qualification'
    if (!formData.targetRole.trim()) newErrors.targetRole = 'Please enter your target role'
    if (!formData.monthlyBudget.trim() || isNaN(Number(formData.monthlyBudget)) || Number(formData.monthlyBudget) <= 0) {
      newErrors.monthlyBudget = 'Please enter a valid monthly budget'
    }
    if (!formData.learningStyle) newErrors.learningStyle = 'Please select a learning style'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setScreen('loading')
    setLoading(true)
    setActiveAgentId(MANAGER_AGENT_ID)
    setErrorMsg(null)

    try {
      const message = `Please analyze and provide skill investment recommendations for:
- Current Degree/Qualification: ${formData.currentDegree}
- Target Role: ${formData.targetRole}
- Monthly Budget: $${formData.monthlyBudget}
- Weekly Hours Available: ${formData.weeklyHours} hours
- Preferred Learning Style: ${formData.learningStyle}`

      const result = await callAIAgent(message, MANAGER_AGENT_ID)

      if (result.success) {
        const parsed = parseAgentResponse(result)
        if (parsed) {
          setReport(parsed)
          setLoadingProgress(100)
          setTimeout(() => setScreen('results'), 500)
        } else {
          setErrorMsg('Unable to parse the advisor response. Please try again.')
          setScreen('input')
        }
      } else {
        setErrorMsg(result?.error ?? 'Failed to get recommendations. Please try again.')
        setScreen('input')
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.')
      setScreen('input')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleStartOver = () => {
    setSampleMode(false)
    setReport(null)
    setScreen('input')
    setFormData({ currentDegree: '', targetRole: '', monthlyBudget: '', weeklyHours: 10, learningStyle: '' })
    setErrors({})
    setErrorMsg(null)
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        {/* Fixed Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiTrendingUp className="h-5 w-5 text-primary" />
              <span className="font-serif text-lg font-bold text-foreground">Skill Investment Advisor</span>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer select-none">
                Sample Data
              </Label>
              <Switch
                id="sample-toggle"
                checked={sampleMode}
                onCheckedChange={setSampleMode}
              />
            </div>
          </div>
        </header>

        {/* ── Input Screen ──────────────────────────────────────────────── */}
        {screen === 'input' && (
          <main>
            <HeroSection onScrollToForm={scrollToForm} />

            <div ref={formRef} className="max-w-2xl mx-auto px-4 sm:px-6 pb-12 -mt-4">
              {/* Error Banner */}
              {errorMsg && (
                <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
                  {errorMsg}
                </div>
              )}

              <Card className="border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Your Profile</CardTitle>
                  <CardDescription>Tell us about your background and goals to receive personalized skill investment recommendations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Degree */}
                  <div className="space-y-2">
                    <Label htmlFor="degree" className="text-sm font-medium">
                      Current Degree / Qualification <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="degree"
                      placeholder="e.g., B.Sc. Computer Science"
                      value={formData.currentDegree}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, currentDegree: e.target.value }))
                        if (errors.currentDegree) setErrors((prev) => ({ ...prev, currentDegree: undefined }))
                      }}
                      className={errors.currentDegree ? 'border-destructive' : ''}
                    />
                    {errors.currentDegree && <p className="text-xs text-destructive">{errors.currentDegree}</p>}
                  </div>

                  {/* Target Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">
                      Target Role <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="role"
                      placeholder="e.g., Data Engineer at FAANG"
                      value={formData.targetRole}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, targetRole: e.target.value }))
                        if (errors.targetRole) setErrors((prev) => ({ ...prev, targetRole: undefined }))
                      }}
                      className={errors.targetRole ? 'border-destructive' : ''}
                    />
                    {errors.targetRole && <p className="text-xs text-destructive">{errors.targetRole}</p>}
                  </div>

                  {/* Monthly Budget */}
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-sm font-medium">
                      Monthly Budget <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        id="budget"
                        type="number"
                        min={1}
                        placeholder="250"
                        value={formData.monthlyBudget}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, monthlyBudget: e.target.value }))
                          if (errors.monthlyBudget) setErrors((prev) => ({ ...prev, monthlyBudget: undefined }))
                        }}
                        className={`pl-7 ${errors.monthlyBudget ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.monthlyBudget && <p className="text-xs text-destructive">{errors.monthlyBudget}</p>}
                  </div>

                  {/* Weekly Hours */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Weekly Hours Available</Label>
                      <span className="text-sm font-semibold text-primary">{formData.weeklyHours}h / week</span>
                    </div>
                    <Slider
                      value={[formData.weeklyHours]}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, weeklyHours: val[0] }))}
                      min={1}
                      max={40}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 hour</span>
                      <span>40 hours</span>
                    </div>
                  </div>

                  {/* Learning Style */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Preferred Learning Style <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.learningStyle}
                      onValueChange={(val) => {
                        setFormData((prev) => ({ ...prev, learningStyle: val }))
                        if (errors.learningStyle) setErrors((prev) => ({ ...prev, learningStyle: undefined }))
                      }}
                    >
                      <SelectTrigger className={errors.learningStyle ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select your preferred style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video Courses</SelectItem>
                        <SelectItem value="reading">Reading / Text</SelectItem>
                        <SelectItem value="handson">Hands-on Projects</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.learningStyle && <p className="text-xs text-destructive">{errors.learningStyle}</p>}
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-3 text-base font-medium"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      <>
                        Get Recommendations <FiArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Sample Data Preview */}
              {sampleMode && report && (
                <div className="mt-6">
                  <Button
                    onClick={() => setScreen('results')}
                    variant="outline"
                    className="w-full"
                  >
                    View Sample Results <FiArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Agent Status */}
              <div className="mt-8">
                <AgentStatusPanel activeAgentId={activeAgentId} loading={loading} />
              </div>
            </div>
          </main>
        )}

        {/* ── Loading Screen ────────────────────────────────────────────── */}
        {screen === 'loading' && (
          <main className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <div className="max-w-md mx-auto px-6 text-center">
              <div className="mb-8">
                <div className="relative mx-auto w-16 h-16 mb-6">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                  Preparing Your Report
                </h2>
                <p className="text-sm text-muted-foreground mb-6 h-5 transition-all duration-300">
                  {LOADING_MESSAGES[loadingMsgIdx]}
                </p>
                <Progress value={loadingProgress} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(loadingProgress)}% complete
                </p>
              </div>

              <Card className="border-border/50 text-left">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs"><FiAward className="mr-1 h-3 w-3" />{formData.currentDegree}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs"><FiTarget className="mr-1 h-3 w-3" />{formData.targetRole}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs"><FiDollarSign className="mr-1 h-3 w-3" />${formData.monthlyBudget}/mo</Badge>
                    <Badge variant="outline" className="text-xs"><FiClock className="mr-1 h-3 w-3" />{formData.weeklyHours}h/week</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        )}

        {/* ── Results Screen ────────────────────────────────────────────── */}
        {screen === 'results' && report && (
          <main>
            <ScrollArea className="h-[calc(100vh-3.5rem)]">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                {/* Profile Summary Bar */}
                <ProfileSummaryBar formData={formData} onEdit={handleStartOver} />

                {/* Results Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full grid grid-cols-4 h-auto">
                    <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">
                      <FiBarChart2 className="mr-1 h-3 w-3 hidden sm:inline-block" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="market" className="text-xs sm:text-sm py-2">
                      <FiTrendingUp className="mr-1 h-3 w-3 hidden sm:inline-block" /> Market
                    </TabsTrigger>
                    <TabsTrigger value="gaps" className="text-xs sm:text-sm py-2">
                      <FiTarget className="mr-1 h-3 w-3 hidden sm:inline-block" /> Gaps
                    </TabsTrigger>
                    <TabsTrigger value="pathways" className="text-xs sm:text-sm py-2">
                      <FiBookOpen className="mr-1 h-3 w-3 hidden sm:inline-block" /> Pathways
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6 mt-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="border-border/50 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <FiTrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
                          <p className="text-xs text-muted-foreground mb-1">Market Demand</p>
                          <p className="font-semibold text-sm">{report?.market_research?.demand_level ?? 'N/A'}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/50 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <FiTarget className="h-5 w-5 mx-auto mb-2 text-primary" />
                          <p className="text-xs text-muted-foreground mb-1">Skill Gaps</p>
                          <p className="font-semibold text-sm">{Array.isArray(report?.skill_gap_analysis?.skill_gaps) ? report.skill_gap_analysis.skill_gaps.length : 0} identified</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/50 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <FiBookOpen className="h-5 w-5 mx-auto mb-2 text-primary" />
                          <p className="text-xs text-muted-foreground mb-1">Pathways</p>
                          <p className="font-semibold text-sm">{Array.isArray(report?.pathway_strategy?.pathways) ? report.pathway_strategy.pathways.length : 0} options</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/50 shadow-sm">
                        <CardContent className="p-4 text-center">
                          <FiDollarSign className="h-5 w-5 mx-auto mb-2 text-primary" />
                          <p className="text-xs text-muted-foreground mb-1">Senior Salary</p>
                          <p className="font-semibold text-sm">{report?.market_research?.salary_range?.senior_level ?? 'N/A'}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Verdict */}
                    {report?.pathway_strategy?.verdict && (
                      <VerdictCard verdict={report.pathway_strategy.verdict} />
                    )}

                    {/* Top Skill Gaps Preview */}
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-serif text-lg flex items-center gap-2">
                          <FiTarget className="h-4 w-4 text-primary" /> Top Priority Gaps
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Array.isArray(report?.skill_gap_analysis?.skill_gaps) &&
                            report.skill_gap_analysis.skill_gaps
                              .sort((a, b) => (a?.learning_priority ?? 99) - (b?.learning_priority ?? 99))
                              .slice(0, 3)
                              .map((gap, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                                      {gap?.learning_priority ?? i + 1}
                                    </span>
                                    <span className="text-sm font-medium">{gap?.skill_name ?? 'Unknown'}</span>
                                  </div>
                                  <Badge variant="outline" className={`text-xs ${getSeverityColor(gap?.gap_severity ?? '')}`}>
                                    {gap?.gap_severity ?? 'Unknown'}
                                  </Badge>
                                </div>
                              ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Market Tab */}
                  <TabsContent value="market" className="mt-6">
                    {report?.market_research && (
                      <MarketSnapshotCard market={report.market_research} />
                    )}
                  </TabsContent>

                  {/* Gaps Tab */}
                  <TabsContent value="gaps" className="mt-6">
                    {report?.skill_gap_analysis && (
                      <SkillGapCard analysis={report.skill_gap_analysis} />
                    )}
                  </TabsContent>

                  {/* Pathways Tab */}
                  <TabsContent value="pathways" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      {Array.isArray(report?.pathway_strategy?.pathways) &&
                        report.pathway_strategy.pathways.map((pathway, i) => (
                          <PathwayCard
                            key={i}
                            pathway={pathway}
                            isHighlighted={pathway?.is_recommended === true}
                          />
                        ))}
                    </div>

                    {report?.pathway_strategy?.verdict && (
                      <VerdictCard verdict={report.pathway_strategy.verdict} />
                    )}
                  </TabsContent>
                </Tabs>

                {/* Start Over */}
                <div className="flex justify-center pt-4 pb-8">
                  <Button onClick={handleStartOver} variant="outline" size="lg" className="px-8">
                    <FiRefreshCw className="mr-2 h-4 w-4" /> Start Over
                  </Button>
                </div>

                {/* Agent Status */}
                <AgentStatusPanel activeAgentId={activeAgentId} loading={loading} />
              </div>
            </ScrollArea>
          </main>
        )}

        {/* Results screen when report is null but screen is results (edge case) */}
        {screen === 'results' && !report && (
          <main className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <div className="text-center p-8">
              <h2 className="font-serif text-xl font-semibold mb-2">No Results Available</h2>
              <p className="text-muted-foreground text-sm mb-4">Something went wrong. Please try again.</p>
              <Button onClick={handleStartOver}>
                <FiRefreshCw className="mr-2 h-4 w-4" /> Start Over
              </Button>
            </div>
          </main>
        )}
      </div>
    </ErrorBoundary>
  )
}
