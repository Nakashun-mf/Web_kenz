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
      <div className="flex h-screen flex-col" style={{ background: '#F1F4F7' }}>

        {/* ══ Header — Meta frosted glass nav ══ */}
        <header
          className="flex h-14 shrink-0 items-center gap-5 px-6"
          style={{
            background: 'rgba(241, 244, 247, 0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {/* Logo mark */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{ background: '#0064E0', boxShadow: '0 2px 8px rgba(0,100,224,0.35)' }}
            >
              <FileSearch className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="text-[13px] tracking-tight"
                style={{ fontWeight: 700, color: '#1C2B33' }}
              >
                図面検図
              </span>
              <span
                className="mt-0.5 text-[10px]"
                style={{ fontWeight: 500, color: '#5D6C7B' }}
              >
                Drawing Inspection
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-5 w-px" style={{ background: '#DEE3E9' }} />

          {/* Tab switcher — Meta pill style */}
          <nav
            className="flex items-center gap-1 rounded-full p-1"
            style={{ background: 'rgba(28, 43, 51, 0.07)' }}
          >
            {TABS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] transition-all duration-150',
                  tab === value
                    ? 'text-white shadow-sm'
                    : 'hover:text-[#1C2B33]',
                )}
                style={{
                  fontWeight: tab === value ? 500 : 400,
                  background: tab === value ? '#0064E0' : 'transparent',
                  color: tab === value ? '#ffffff' : '#5D6C7B',
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Version badge */}
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px]"
            style={{ fontWeight: 600, background: '#DEE3E9', color: '#5D6C7B' }}
          >
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
