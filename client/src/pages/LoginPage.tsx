import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Loader2 } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiError, api } from '@/lib/api'
import type { User } from '@/types'

export function LoginPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(
    null,
  )
  const [pending, setPending] = useState(false)

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)
    const fd = new FormData(e.currentTarget)
    setPending(true)
    try {
      await api<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: fd.get('email'),
          password: fd.get('password'),
        }),
      })
      setMessage({ kind: 'success', text: 'Logged in. Redirecting…' })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const text = err instanceof ApiError ? err.message : 'Login failed'
      setMessage({ kind: 'error', text })
    } finally {
      setPending(false)
    }
  }

  async function onRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)
    const fd = new FormData(e.currentTarget)
    setPending(true)
    try {
      await api<{ user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: fd.get('name'),
          email: fd.get('email'),
          password: fd.get('password'),
        }),
      })
      setMessage({ kind: 'success', text: 'Account created. Redirecting…' })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const text = err instanceof ApiError ? err.message : 'Could not register'
      setMessage({ kind: 'error', text })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="min-h-svh bg-muted/30 px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Building2 className="size-6" aria-hidden />
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Welcome</h1>
          <p className="text-sm text-muted-foreground">
            Use your email and a password of at least 8 characters.
          </p>
        </div>

        {message ? (
          <Alert variant={message.kind === 'error' ? 'destructive' : 'default'}>
            <AlertTitle>{message.kind === 'error' ? 'Something went wrong' : 'Success'}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>Log in or create a buyer account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Log in</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-4 space-y-4">
                <form className="space-y-4" onSubmit={onLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      required
                      disabled={pending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      disabled={pending}
                    />
                  </div>
                  <Button type="submit" className="h-9 w-full" disabled={pending}>
                    {pending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Please wait
                      </>
                    ) : (
                      'Log in'
                    )}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="register" className="mt-4 space-y-4">
                <form className="space-y-4" onSubmit={onRegister}>
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full name</Label>
                    <Input
                      id="reg-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      disabled={pending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={pending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      disabled={pending}
                    />
                  </div>
                  <Button type="submit" className="h-9 w-full" disabled={pending}>
                    {pending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Please wait
                      </>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Button
            variant="link"
            className="h-auto p-0 text-muted-foreground"
            nativeButton={false}
            render={<Link to="/" />}
          >
            Home
          </Button>
          {' · '}
          <Button
            variant="link"
            className="h-auto p-0 text-muted-foreground"
            nativeButton={false}
            render={<Link to="/dashboard" />}
          >
            Dashboard
          </Button>
        </p>
      </div>
    </div>
  )
}
