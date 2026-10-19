import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value);

  // Filter options if search term is entered
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(
      o =>
        o.label.toLowerCase().includes(term) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(term))
    );
  }, [options, searchTerm]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && options.length > 7) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen, options.length]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target !== searchInputRef.current) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIdx = filteredOptions.findIndex(o => o.value === value);
        if (currentIdx < filteredOptions.length - 1) {
          onChange(filteredOptions[currentIdx + 1].value);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        const currentIdx = filteredOptions.findIndex(o => o.value === value);
        if (currentIdx > 0) {
          onChange(filteredOptions[currentIdx - 1].value);
        }
      }
    }
  };

  return (
    <div className={`relative flex flex-col gap-1 w-full text-left ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      {/* Trigger Button - minimum 48px height for touch target */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label || placeholder}
        className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-between transition-all outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent select-none active:scale-[0.99] ${
          isOpen
            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'cursor-pointer hover:border-slate-400 dark:hover:border-slate-600'}`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <>
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold">
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={`text-slate-500 transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Options */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute top-[calc(100%+4px)] left-0 w-full z-50 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-h-72 overflow-y-auto py-1 focus:outline-none divide-y divide-slate-100 dark:divide-slate-800/60"
        >
          {/* Search box if there are more than 7 options */}
          {options.length > 7 && (
            <div className="p-2 sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={`Search in ${label || 'options'}...`}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 select-text"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`min-h-[46px] px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs sm:text-sm select-none ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex flex-col text-left truncate mr-2">
                    <span className="truncate">{option.label}</span>
                    {option.sublabel && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {option.sublabel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {option.badge && (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">
                        {option.badge}
                      </span>
                    )}
                    {isSelected && <Check size={16} className="text-blue-600 dark:text-blue-400" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              No matching options found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
