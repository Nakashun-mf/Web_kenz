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
      <div className="flex h-screen flex-col bg-slate-100">

        {/* ══ Header ══ */}
        <header className="flex h-13 shrink-0 items-center gap-5 border-b border-slate-800 bg-slate-900 px-5">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
              <FileSearch className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold leading-tight text-white tracking-tight">図面検図</p>
              <p className="text-[10px] leading-tight text-slate-500 mt-0.5">Drawing Inspection Tool</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-700" />

          {/* Tab switcher */}
          <nav className="flex items-center gap-0.5">
            {TABS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all',
                  tab === value
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex-1" />
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
