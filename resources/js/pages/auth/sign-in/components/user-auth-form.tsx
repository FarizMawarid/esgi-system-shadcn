import { HTMLAttributes, useState } from 'react'
import { useForm } from '@inertiajs/react'
import { cn } from '@/lib/utils'
import InputError from '@/components/InputError'
import { Factory, User, Eye, EyeOff, LogIn, ChevronDown } from 'lucide-react'

type UserAuthFormProps = HTMLAttributes<HTMLDivElement> & {
  status?: string;
  canResetPassword?: boolean;
}

export function UserAuthForm({ className, status, ...props }: UserAuthFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  const { data, setData, post, processing, errors, reset } = useForm({
    factory: 'Factory Klego',
    email: '142300718',
    password: 'password',
    remember: false,
  })

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    post(route('login'), {
      onFinish: () => {
        reset('password')
      },
      preserveScroll: true,
    })
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      {status && (
        <div className="mb-4 rounded-lg bg-green-50 p-2.5 text-center text-xs font-medium text-green-700 border border-green-200">
          {status}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {/* Factory Selection */}
        <div className="space-y-1">
          <div className="relative">
            <select
              id="factory"
              value={data.factory}
              onChange={(e) => setData('factory', e.target.value)}
              className="w-full h-11 px-3.5 pr-14 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
            >
              <option value="">Select Factory</option>
              <option value="Factory Klego">Factory Klego</option>
              <option value="Factory Boyolali">Factory Boyolali</option>
              <option value="Factory Semarang">Factory Semarang</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none gap-2">
              <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
              <Factory className="w-4 h-4 text-slate-600" />
            </div>
          </div>
        </div>

        {/* Username / Employee ID */}
        <div className="space-y-1">
          <div className="flex h-11 w-full rounded-lg border border-blue-400 bg-[#ebf3fc] overflow-hidden focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/25 transition-all">
            <input
              id="email"
              type="text"
              placeholder="142300718"
              autoComplete="username"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              className="w-full bg-transparent px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <div className="flex items-center justify-center border-l border-slate-200/80 bg-[#ebf3fc] px-3.5 text-slate-600">
              <User className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <InputError message={errors.email} className="text-xs text-red-500 mt-1" />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex h-11 w-full rounded-lg border border-slate-200 bg-[#ebf3fc] overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/25 transition-all">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              className="w-full bg-transparent px-3.5 text-sm text-slate-800 placeholder:text-slate-400 tracking-wider focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center justify-center border-l border-slate-200/80 bg-[#ebf3fc] px-3.5 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-slate-600" />
              ) : (
                <Eye className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
          <InputError message={errors.password} className="text-xs text-red-500 mt-1" />
        </div>

        {/* Remember Me & Sign In Button */}
        <div className="flex items-center justify-between pt-2">
          <label htmlFor="remember" className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="remember"
              type="checkbox"
              checked={data.remember}
              onChange={(e) => setData('remember', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
            />
            <span className="text-xs text-slate-500 font-normal">Remember Me</span>
          </label>

          <button
            type="submit"
            disabled={processing}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#007bff] hover:bg-[#0069d9] active:bg-[#0062cc] text-white text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-70 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{processing ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

