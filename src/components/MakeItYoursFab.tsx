import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { brand } from '../brand.config'
import { MakeItYoursPrompt } from './MakeItYoursPrompt'

// Floating CTA on every page: opens the re-brand prompt for an AI coding agent.
// Sits bottom-right, clearing the mobile bottom-nav (bottom-[5.5rem]) and resting
// in the free desktop corner (the explainer drawer is top-right there).
export function MakeItYoursFab() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* One-time slide-up entrance (~4s after load); calm, no idle motion. */}
      <DialogTrigger asChild>
        <Button className="fixed bottom-[5.5rem] right-4 z-30 animate-fab-in gap-1.5 rounded-full shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95 md:bottom-4">
          <Sparkles className="size-4" /> Make this app yours
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="size-4" /> Make this app yours</DialogTitle>
          <DialogDescription>
            Paste this prompt into any AI coding agent (Claude Code, Cursor, …) — it clones
            {' '}{brand.name}, re-brands it into your product, and shows you the result in one pass.
          </DialogDescription>
        </DialogHeader>
        <MakeItYoursPrompt />
      </DialogContent>
    </Dialog>
  )
}
