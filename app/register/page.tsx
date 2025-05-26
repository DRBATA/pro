import { Suspense } from "react"
import { RegisterForm } from "@/components/register-form"

// Fallback loading component
function RegisterFormFallback() {
  return (
    <div className="w-full max-w-md p-8 space-y-4 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 text-center">
      <div className="h-10 w-10 rounded-full bg-slate-700/50 animate-pulse mx-auto"></div>
      <div className="h-6 w-48 rounded bg-slate-700/50 animate-pulse mx-auto"></div>
      <div className="h-4 w-full rounded bg-slate-700/50 animate-pulse"></div>
      <div className="h-10 w-full rounded bg-slate-700/50 animate-pulse"></div>
      <div className="h-4 w-full rounded bg-slate-700/50 animate-pulse"></div>
      <div className="h-10 w-full rounded bg-slate-700/50 animate-pulse"></div>
      <div className="h-10 w-full rounded bg-slate-700/50 animate-pulse"></div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 text-white flex flex-col items-center justify-center p-4">
      <Suspense fallback={<RegisterFormFallback />}>
        <RegisterForm />
      </Suspense>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>
    </div>
  )
}
