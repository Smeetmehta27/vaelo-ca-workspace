'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';

export interface ReportExportMenuProps {
  clientId: string;
  reportType: 'cma' | 'feasibility' | 'health';
  hasReport: boolean;
}

export function ReportExportMenu({ clientId, reportType, hasReport }: ReportExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!hasReport) return null;


  const getExportUrl = (format: 'docx' | 'xlsx' | 'pdf') => {
    return `/api/clients/${clientId}/reports/export?type=${reportType}&format=${format}`;
  };

  return (
    <div className="relative inline-block text-left no-print" ref={menuRef}>
      <Button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-bronze hover:bg-bronze-deep text-white border-transparent text-sm"
      >
        Export Options
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-paper ring-1 ring-stone-line focus:outline-none z-50">
          <div className="py-1">
            <a
              href={getExportUrl('pdf')}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-ink hover:bg-paper-dim"
            >
              Download as PDF
            </a>
            <a
              href={getExportUrl('docx')}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-ink hover:bg-paper-dim"
            >
              Download as Word
            </a>
            <a
              href={getExportUrl('xlsx')}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-ink hover:bg-paper-dim"
            >
              Download as Excel
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
