import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { brand } from '../brand.config'
import { MakeItYoursPrompt } from './MakeItYoursPrompt'

export function MakeItYours() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="size-4" /> Make it yours</CardTitle>
        <CardDescription>
          Paste this prompt into any AI coding agent (Claude Code, Cursor, …) — it clones
          {' '}{brand.name}, re-brands it into your product, and shows you the result in one pass.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MakeItYoursPrompt />
      </CardContent>
    </Card>
  )
}
