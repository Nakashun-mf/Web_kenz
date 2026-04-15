import * as React from 'react'
import { FileSearch, GitCompareArrows } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { InspectionPage } from '@/pages/InspectionPage'
import { ComparisonPage } from '@/pages/ComparisonPage'
import { cn } from '@/lib/utils'

type Tab = 'inspection' | 'comparison'

const TABS = [
  { value: 'inspection' as Tab, icon: FileSearch,       label: '検図モード' },
  { value: 'comparison' as Tab, icon: GitCompareArrows, label: '比較モード' },
] as const

export default function App() {
  const [tab, setTab] = React.useState<Tab>('inspection')

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex h-screen flex-col bg-slate-50">

        {/* ══ Header ══ */}
        <header className="flex h-14 shrink-0 items-center gap-5 border-b border-slate-200 bg-white px-6 shadow-sm">

          {/* Logo mark */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
              <FileSearch className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[13px] font-bold tracking-tight text-slate-900">図面検図</span>
              <span className="mt-0.5 text-[10px] font-medium text-slate-400">Drawing Inspection</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-200" />

          {/* Tab switcher — pill style */}
          <nav className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {TABS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-1.5 text-[13px] font-medium transition-all duration-150',
                  tab === value
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Version badge */}
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
            v1.0
          </span>
        </header>

        {/* ══ Page content ══ */}
        <main className="relative flex-1 overflow-hidden">
          <div className={cn('absolute inset-0 flex flex-col', tab !== 'inspection' && 'hidden')}>
            <InspectionPage />
          </div>
          <div className={cn('absolute inset-0 flex flex-col', tab !== 'comparison' && 'hidden')}>
            <ComparisonPage />
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
