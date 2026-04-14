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
        <header className="flex h-16 shrink-0 items-center gap-6 border-b border-slate-800 bg-slate-900 px-8">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
              <FileSearch className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[14px] font-bold leading-tight text-white tracking-tight">図面検図</p>
              <p className="text-[11px] leading-tight text-slate-500 mt-0.5">Drawing Inspection Tool</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-700" />

          {/* Tab switcher */}
          <nav className="flex items-center gap-1">
            {TABS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all',
                  tab === value
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
                )}
              >
                <Icon className="h-4 w-4" />
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
