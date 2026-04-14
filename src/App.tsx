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
        <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-8">

          {/* Left: logo */}
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
              <FileSearch className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold leading-tight text-slate-800">図面検図</p>
              <p className="text-[10px] leading-tight text-slate-400 mt-0.5">Drawing Inspection Tool</p>
            </div>
          </div>

          {/* Center: tab switcher */}
          <div className="flex items-center gap-1 rounded-xl bg-blue-50 p-1">
            {TABS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold transition-all',
                  tab === value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-400 hover:text-blue-600',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Right: reserved for future actions */}
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
