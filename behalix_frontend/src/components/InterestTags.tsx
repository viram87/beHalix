import { useEffect, useRef, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MAX_INTERESTS = 10;

type InterestTagsProps = {
  value: string[];
  onChange: (interests: string[]) => void;
  disabled?: boolean;
};

export function InterestTags({ value, onChange, disabled }: InterestTagsProps) {
  const [masterList, setMasterList] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ interests: string[] }>('/interests').then(({ data }) => setMasterList(data.interests ?? []));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const add = (interest: string) => {
    const trimmed = interest.trim();
    if (!trimmed || value.length >= MAX_INTERESTS) return;
    const normalized = trimmed.slice(0, 50);
    if (value.some((i) => i.toLowerCase() === normalized.toLowerCase())) return;
    onChange([...value, normalized]);
    setCustomInput('');
    setDropdownOpen(false);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const availableFromList = masterList.filter(
    (m) => !value.some((i) => i.toLowerCase() === m.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label>Interests (max {MAX_INTERESTS})</Label>
      <div className="flex flex-wrap gap-2 rounded-md border border-input bg-background p-2 min-h-[42px]">
        {value.map((interest, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-sm"
          >
            {interest}
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded-full p-0.5 hover:bg-primary/20"
                aria-label={`Remove ${interest}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>
      {!disabled && value.length < MAX_INTERESTS && (
        <div className="flex flex-wrap gap-2 items-start">
          <div className="relative" ref={dropdownRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDropdownOpen((o) => !o)}
              className="gap-1 min-w-[140px] justify-between"
            >
              Add from list
              <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </Button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 z-10 w-56 max-h-48 overflow-auto rounded-md border bg-background shadow-md py-1">
                {availableFromList.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">All added</p>
                ) : (
                  availableFromList.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => add(m)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      {m}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="flex gap-1 flex-1 min-w-[180px]">
            <Input
              placeholder="Or type custom and press Enter"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  add(customInput);
                }
              }}
              className="h-9"
            />
            <Button type="button" variant="secondary" size="sm" onClick={() => add(customInput)} className="shrink-0">
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
