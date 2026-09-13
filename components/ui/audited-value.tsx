'use client'

import React, { useState, useRef, useEffect } from 'react'
import { formatValue, ValueType } from '@/components/cma/utils'

export type AuditedValueProps = {
  value: number;
  formula: string;
  inputs: Record<string, number>;
}

export function AuditedValueDisplay({ data, valueType = 'number', currencyDecimals }: { data: AuditedValueProps, valueType?: ValueType, currencyDecimals?: number }) {
  const [expanded, setExpanded] = useState(false)
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom')
  const containerRef = useRef<HTMLDivElement>(null)

  const formatOutput = (num: number) => {
    return formatValue(num, valueType, currencyDecimals);
  }

  const toggleExpand = () => {
    if (!expanded && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      
      // If there is less than 300px of space below the element, 
      // position the popup above it to prevent clipping by the browser viewport.
      if (spaceBelow < 300) {
        setPosition('top')
      } else {
        setPosition('bottom')
      }
    }
    setExpanded(!expanded)
  }

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpanded(false)
      }
    }

    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [expanded])

  return (
    <div className="relative flex flex-col group min-w-[120px]" ref={containerRef}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-ink">{formatOutput(data.value)}</span>
        <button 
          onClick={toggleExpand}
          className="text-[10px] uppercase tracking-wider font-semibold text-stone hover:text-blue-600 transition-colors"
          title="View Calculation"
        >
          {expanded ? 'Hide' : 'Audit'}
        </button>
      </div>
      
      {expanded && (
        <div 
          className={`absolute right-0 ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} p-3 bg-paper border border-stone-line rounded-md shadow-xl text-xs text-ink-soft w-72 z-[100] text-left max-h-[250px] overflow-y-auto`}
        >
          <p className="font-semibold text-ink mb-1">Formula:</p>
          <code className="block bg-paper-dim p-1.5 rounded mb-2 font-mono text-[10px] break-words">{data.formula}</code>
          <p className="font-semibold text-ink mb-1">Inputs:</p>
          <ul className="list-none space-y-1">
            {Object.entries(data.inputs).map(([key, val]) => (
              <li key={key} className="flex justify-between items-center border-b border-slate-50 pb-1 last:border-0">
                <span className="font-mono text-ink-soft break-all pr-2">{key}</span> 
                <span className="font-mono font-medium whitespace-nowrap">{formatOutput(val)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
