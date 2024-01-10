import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Single source of truth for the re-brand prompt — rendered by the Profile
// "Make it yours" card and the floating MakeItYoursFab so the two never drift.
export const MAKE_IT_YOURS_PROMPT = `Clone and set up the Swipelux neobank starter, then re-brand it as mine:
  git clone https://github.com/swipelux/neobank-starter && cd neobank-starter && npm install
Read AGENTS.md, then follow PROMPT.md to re-brand this neobank demo into my product.
Start by asking me my company name and any brand notes (website, colors, vibe, audience);
derive the rest from there, or choose tastefully if I give you little. Apply it on a new git
branch by editing only src/theme.css and src/brand.config.ts, keep all tests and the build
green, then run it (npm run dev) and show me the result and what you chose.`

// The prompt block + copy-to-clipboard button, with transient "copied" feedback.
export function MakeItYoursPrompt() {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = () => {
    navigator.clipboard?.writeText(MAKE_IT_YOURS_PROMPT).catch(() => {})
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="space-y-3">
      <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs text-muted-foreground">{MAKE_IT_YOURS_PROMPT}</pre>
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Copy prompt
      </Button>
    </div>
  )
}
