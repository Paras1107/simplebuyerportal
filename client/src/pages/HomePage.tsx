import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function HomePage() {
  return (
    <div className="min-h-svh bg-muted/30">
      <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-8 px-4 py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Building2 className="size-8" aria-hidden />
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Buyer portal
          </h1>
          <p className="max-w-sm text-pretty text-muted-foreground">
            Sign in to save favourite listings. Brokers use this space to give buyers a
            clear, simple dashboard.
          </p>
        </div>
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Create an account or log in to manage your saved properties.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Button
              nativeButton={false}
              render={<Link to="/login" />}
              className="h-9 flex-1"
            >
              Log in or register
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to="/dashboard" />}
              className="h-9 flex-1"
            >
              Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
