import { useState } from 'react'
import { Check, Copy, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { brand } from '../brand.config'

const PROMPT = `Clone and set up the Swipelux neobank starter, then re-brand it as mine:
  git clone https://github.com/swipelux/neobank-starter && cd neobank-starter && npm install
Read AGENTS.md, then follow PROMPT.md to re-brand this neobank demo into my product.
Start by asking me my company name and any brand notes (website, colors, vibe, audience);
derive the rest from there, or choose tastefully if I give you little. Apply it on a new git
branch by editing only src/theme.css and src/brand.config.ts, keep all tests and the build
green, then run it (npm run dev) and show me the result and what you chose.`

export function MakeItYours() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(PROMPT).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="size-4" /> Make it yours</CardTitle>
        <CardDescription>
          Paste this prompt into any AI coding agent (Claude Code, Cursor, …) — it clones
          {' '}{brand.name}, re-brands it into your product, and shows you the result in one pass.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs text-muted-foreground">{PROMPT}</pre>
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Copy prompt
        </Button>
      </CardContent>
    </Card>
  )
}
