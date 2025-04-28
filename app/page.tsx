import { Suspense } from "react"
import { HistoryProvider } from "@/context/history-context"
import TranslationAppShell from "@/components/translation-app-shell"
import TranslationHistory from "@/components/translation-history"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RecaptchaStatus } from "@/components/recaptcha-status"

export default async function TranslationApp() {
  return (
    <HistoryProvider>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">AI Translation App</h1>

        <Suspense fallback={<TranslationCardSkeleton />}>
          <TranslationAppShell />
        </Suspense>

        <div className="mt-8 w-full max-w-3xl mx-auto">
          <Suspense fallback={<HistorySkeleton />}>
            <TranslationHistory />
          </Suspense>
        </div>

        {/* reCAPTCHA status indicator (only shown in development) */}
        <div className="w-full max-w-3xl mx-auto">
          <RecaptchaStatus />
        </div>
      </div>
    </HistoryProvider>
  )
}

function TranslationCardSkeleton() {
  return (
    <Card className="w-full max-w-3xl mx-auto p-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-2 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex items-end justify-center">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="col-span-2 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </Card>
  )
}

function HistorySkeleton() {
  return (
    <Card className="w-full p-6">
      <Skeleton className="h-8 w-1/4 mb-4" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </Card>
  )
}
