import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Heart, Loader2, LogOut, MapPin, Trash2 } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApiError, api } from '@/lib/api'
import type { FavouriteItem, Property, User } from '@/types'

function formatPropertyLine(p: Property) {
  return `${p.title} — ${p.address} (${p.priceDisplay})`
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [propertiesPage, setPropertiesPage] = useState(1)
  const [propertiesTotalPages, setPropertiesTotalPages] = useState(1)
  const [favourites, setFavourites] = useState<FavouriteItem[]>([])
  const [favouriteByProperty, setFavouriteByProperty] = useState<Map<number, number>>(
    () => new Map(),
  )
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(
    null,
  )

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showTransientMessage(kind: 'error' | 'success', text: string, ms = 2500) {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current)
    setMessage({ kind, text })
    messageTimerRef.current = setTimeout(() => setMessage(null), ms)
  }

  const refresh = useCallback(async () => {
    const [me, favData, propData] = await Promise.all([
      api<{ user: User }>('/api/auth/me'),
      api<{ favourites: FavouriteItem[] }>('/api/favourites'),
      api<{
        properties: Property[]
        totalPages: number
      }>(`/api/properties?page=${propertiesPage}&limit=10`),
    ])
    setUser(me.user)
    setFavourites(favData.favourites)
    setFavouriteByProperty(
      new Map(favData.favourites.map((f) => [f.property.id, f.favouriteId])),
    )
    setProperties(propData.properties)
    setPropertiesTotalPages(propData.totalPages ?? 1)
  }, [propertiesPage])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await refresh()
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        setUser(null)
        setMessage({
          kind: 'error',
          text: err instanceof ApiError ? err.message : 'Could not load your dashboard.',
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate, refresh])

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current)
    }
  }, [])

  useEffect(() => {
    // Keep UI consistent when paging.
    setDetailsOpen(false)
    setSelectedProperty(null)
  }, [propertiesPage])

  async function toggleFavourite(propertyId: number) {
    setActionId(propertyId)
    try {
      const favId = favouriteByProperty.get(propertyId)
      if (favId != null) {
        await api(`/api/favourites/${favId}`, { method: 'DELETE' })
        showTransientMessage('success', 'Removed from favourites.')
      } else {
        await api('/api/favourites', {
          method: 'POST',
          body: JSON.stringify({ propertyId }),
        })
        showTransientMessage('success', 'Saved to favourites.')
      }
      await refresh()
    } catch (err) {
      showTransientMessage(
        'error',
        err instanceof ApiError ? err.message : 'Update failed.',
        3500,
      )
    } finally {
      setActionId(null)
    }
  }

  async function removeFavourite(favouriteId: number) {
    setActionId(favouriteId)
    try {
      await api(`/api/favourites/${favouriteId}`, { method: 'DELETE' })
      showTransientMessage('success', 'Removed from favourites.')
      await refresh()
    } catch (err) {
      showTransientMessage(
        'error',
        err instanceof ApiError ? err.message : 'Could not remove.',
        3500,
      )
    } finally {
      setActionId(null)
    }
  }

  async function logout() {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current)
    setMessage(null)
    try {
      await api('/api/auth/logout', { method: 'POST' })
      navigate('/login', { replace: true })
    } catch (err) {
      setMessage({
        kind: 'error',
        text: err instanceof ApiError ? err.message : 'Logout failed.',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/30">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-muted/30">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <Building2 className="size-6" aria-hidden />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight">Your dashboard</h1>
              {user ? (
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{user.name}</span>
                  <Badge variant="secondary" className="font-normal">
                    {user.role}
                  </Badge>
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Not signed in</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => void logout()}
          >
            <LogOut className="size-3.5" />
            Log out
          </Button>
        </header>

        {message ? (
          <Alert variant={message.kind === 'error' ? 'destructive' : 'default'}>
            <AlertTitle>{message.kind === 'error' ? 'Notice' : 'Done'}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="size-4 opacity-70" aria-hidden />
              Browse properties
            </CardTitle>
            <CardDescription>
              Save a listing to your favourites. Click again to remove it.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 pb-4 pt-1">
              <ScrollArea className="h-[min(420px,50vh)]">
                <ul className="space-y-2 pr-3 pt-2">
                  {properties.map((p) => {
                    const saved = favouriteByProperty.has(p.id)
                    const busy = actionId === p.id
                    return (
                      <li
                        key={p.id}
                        className="flex flex-col gap-2 rounded-lg border border-border/80 bg-card/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <p className="text-sm leading-snug">{formatPropertyLine(p)}</p>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={saved ? 'outline' : 'default'}
                            className="shrink-0 gap-1"
                            disabled={busy}
                            onClick={() => void toggleFavourite(p.id)}
                          >
                            {busy ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Heart
                                className={saved ? 'size-3.5 fill-current' : 'size-3.5'}
                              />
                            )}
                            {saved ? 'Saved' : 'Add to favourites'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => {
                              setSelectedProperty(p)
                              setDetailsOpen(true)
                            }}
                          >
                            Details
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </ScrollArea>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 pb-6 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPropertiesPage((p) => Math.max(1, p - 1))}
                disabled={propertiesPage <= 1}
              >
                Previous
              </Button>
              <p className="text-sm text-muted-foreground">
                Page {propertiesPage} of {propertiesTotalPages}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPropertiesPage((p) => Math.min(propertiesTotalPages, p + 1))
                }
                disabled={propertiesPage >= propertiesTotalPages}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="size-4 opacity-70" aria-hidden />
              My favourites
            </CardTitle>
            <CardDescription>
              Listings you have saved. Only you can see or change this list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {favourites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No favourites yet.</p>
            ) : (
              <ScrollArea className="h-[min(320px,40vh)]">
                <ul className="space-y-2 pr-3">
                  {favourites.map((f, i) => (
                    <li key={f.favouriteId}>
                      {i > 0 ? <Separator className="mb-2" /> : null}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm leading-snug">{formatPropertyLine(f.property)}</p>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="shrink-0 gap-1"
                          disabled={actionId === f.favouriteId}
                          onClick={() => void removeFavourite(f.favouriteId)}
                        >
                          {actionId === f.favouriteId ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                          Remove
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Button
            variant="link"
            className="h-auto p-0 text-muted-foreground"
            nativeButton={false}
            render={<Link to="/login" />}
          >
            Account
          </Button>
          {' · '}
          <Button
            variant="link"
            className="h-auto p-0 text-muted-foreground"
            nativeButton={false}
            render={<Link to="/" />}
          >
            Home
          </Button>
        </p>

        <Dialog
          open={detailsOpen}
          onOpenChange={(o) => {
            setDetailsOpen(o)
            if (!o) setSelectedProperty(null)
          }}
        >
          <DialogContent className="max-w-2xl">
            {selectedProperty ? (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedProperty.title}</DialogTitle>
                  <DialogDescription>
                    {selectedProperty.address} · {selectedProperty.priceDisplay}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <img
                    src={selectedProperty.imageUrl}
                    alt={selectedProperty.title}
                    className="h-56 w-full rounded-lg border border-border/70 object-cover"
                  />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {selectedProperty.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {(() => {
                      const saved = favouriteByProperty.has(selectedProperty.id)
                      const busy = actionId === selectedProperty.id
                      return (
                        <Button
                          size="sm"
                          variant={saved ? 'outline' : 'default'}
                          disabled={busy}
                          onClick={() => void toggleFavourite(selectedProperty.id)}
                        >
                          {busy ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Heart
                              className={saved ? 'size-3.5 fill-current' : 'size-3.5'}
                            />
                          )}
                          {saved ? 'Remove from favourites' : 'Save to favourites'}
                        </Button>
                      )
                    })()}
                  </div>
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
