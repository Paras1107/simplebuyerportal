export type User = {
  id: number
  email: string
  name: string
  role: string
}

export type Property = {
  id: number
  title: string
  address: string
  priceCents: number
  description: string
  imageUrl: string
  priceDisplay: string
}

export type FavouriteItem = {
  favouriteId: number
  property: Property
}
