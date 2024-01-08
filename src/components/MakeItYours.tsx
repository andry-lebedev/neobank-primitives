import { useState } from 'react'
import { Check, Copy, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { brand } from '../brand.config'

const PROMPT = `Read AGENTS.md, then follow PROMPT.md to re-brand this neobank demo for me.
I'm <Company>. [Optional: my website is <url> / brand notes: <colors, vibe, audience>]
Derive my brand (or choose tastefully if I gave you little), apply it on a new git branch by
editing only src/theme.css and src/brand.config.ts, keep all tests and the build green, then
show me the result and what you chose.`

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
          Paste this prompt into an AI coding agent (Claude Code, Cursor, …) opened in this repo —
          it re-brands {brand.name} into your product in one pass.
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
