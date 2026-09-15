import { UserAuthForm } from './components/user-auth-form'
import { Head } from '@inertiajs/react'

export default function SignIn2({
  status,
  canResetPassword,
}: {
  status?: string;
  canResetPassword: boolean;
}) {
  return (
    <>
      <Head title="Login - ESGI SYSTEM" />
      <div className="min-h-screen w-full bg-[#f4f7fb] flex items-center justify-center p-4 sm:p-6">
        {/* Main Card Container */}
        <div className="w-full max-w-[880px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-slate-100/80 flex flex-col md:flex-row overflow-hidden">

          {/* Left Side: Brand Logo */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-8 sm:p-12 md:border-r border-slate-100">
            <div className="flex items-center gap-3 sm:gap-4 select-none">
              <img
                src="/images/esgi-globe.png"
                alt="ESGI Globe Logo"
                className="w-28 h-28 sm:w-72 sm:h-72 object-contain"
              />
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="w-full md:w-1/2 flex flex-col justify-center p-8 sm:p-12">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                Welcome Back
              </h2>
              <p className="text-xs text-slate-400 mt-1.5">
                Sign in to start your session
              </p>
            </div>

            <UserAuthForm canResetPassword={canResetPassword} status={status} />
          </div>

        </div>
      </div>
    </>
  )
}

