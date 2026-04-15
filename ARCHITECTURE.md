# Author Books Map Architecture

## Folder Structure

```
author-books-map/
|-- app/
|   |-- (auth)/
|   |   |-- login/
|   |   |   |-- page.tsx
|   |   |-- register/
|   |   |   |-- page.tsx
|   |-- dashboard/
|   |   |-- page.tsx
|   |-- map/
|   |   |-- page.tsx
|   |-- books/
|   |   |-- [id]/
|   |   |   |-- page.tsx
|   |   |-- search/
|   |   |   |-- page.tsx
|   |-- api/
|   |   |-- auth/
|   |   |   |-- route.ts
|   |   |-- books/
|   |   |   |-- route.ts
|   |   |   |-- [id]/
|   |   |   |   |-- route.ts
|   |   |   |   |-- locations/
|   |   |   |   |   |-- route.ts
|   |   |-- google-books/
|   |   |   |-- search/
|   |   |   |   |-- route.ts
|   |   |   |-- authors/
|   |   |   |   |-- route.ts
|   |-- globals.css
|   |-- layout.tsx
|   |-- page.tsx
|   |-- providers.tsx
|-- components/
|   |-- ui/
|   |   |-- (shadcn components)
|   |-- map/
|   |   |-- BookMap.tsx
|   |   |-- MapMarker.tsx
|   |-- books/
|   |   |-- BookCard.tsx
|   |   |-- BookSearch.tsx
|   |   |-- BookForm.tsx
|   |-- auth/
|   |   |-- AuthForm.tsx
|   |-- layout/
|   |   |-- Header.tsx
|   |   |-- Sidebar.tsx
|   |-- providers/
|   |   |-- MapProvider.tsx
|   |   |-- AuthProvider.tsx
|-- lib/
|   |-- db.ts
|   |-- auth.ts
|   |-- google-books.ts
|   |-- utils.ts
|   |-- validations/
|   |   |-- books.ts
|   |   |-- auth.ts
|   |-- types/
|   |   |-- books.ts
|   |   |-- auth.ts
|   |   |-- map.ts
|-- prisma/
|   |-- schema.prisma
|   |-- migrations/
|   |-- seed.ts
|-- public/
|   |-- icons/
|   |-- images/
|-- .env.local
|-- .env.example
|-- package.json
|-- tailwind.config.ts
|-- next.config.js
|-- tsconfig.json
|-- README.md
```

## Tech Decisions

### Authentication
- **NextAuth.js** with JWT strategy
- Simple email/password authentication
- Session management with secure HTTP-only cookies
- Vercel-compatible deployment

### Database
- **PostgreSQL** hosted on **Supabase**
- **Prisma ORM** for type-safe database access
- Connection pooling for performance

### API Layer
- Next.js API Routes (App Router)
- RESTful design with proper HTTP methods
- Input validation with Zod schemas
- Error handling with consistent response format

### Map Integration
- **Leaflet** for interactive maps
- **react-leaflet** for React integration
- OpenStreetMap tiles (free, no API key required)
- Custom markers for book locations

### External APIs
- **Google Books API** for book/author data
- Rate limiting and caching strategies
- Fallback handling for API failures

## Prisma Schema

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  books BookLocation[]

  @@map("users")
}

model Author {
  id          String   @id @default(cuid())
  name        String   @unique
  googleId    String?  @unique // Google Books author ID
  description String?
  imageUrl    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  books Book[]

  @@map("authors")
}

model Book {
  id          String   @id @default(cuid())
  title       String
  subtitle    String?
  isbn        String?  @unique
  googleId    String?  @unique // Google Books volume ID
  description String?
  pageCount   Int?
  imageUrl    String?
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  authorId    String
  author      Author @relation(fields: [authorId], references: [id], onDelete: Cascade)
  locations   BookLocation[]

  @@map("books")
}

model BookLocation {
  id          String   @id @default(cuid())
  latitude    Float
  longitude   Float
  address     String?
  city        String?
  country     String?
  notes       String?
  locationType String  // 'purchased' | 'sent' | 'read' | 'gifted'
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  bookId String
  book   Book @relation(fields: [bookId], references: [id], onDelete: Cascade)
  userId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("book_locations")
}
```

## Data Flow

### User Authentication Flow
1. Client submits credentials to `/api/auth`
2. Server validates and creates JWT token
3. Token stored in HTTP-only cookie
4. Subsequent requests include token for validation

### Book Search Flow
1. User searches author/books in UI
2. Request to `/api/google-books/search`
3. Server calls Google Books API
4. Results cached in Redis (optional)
5. Formatted response to client

### Book Collection Flow
1. User selects book from search results
2. POST to `/api/books` with book data
3. Server upserts book and author data
4. Returns book ID for location tracking

### Location Management Flow
1. User adds location to book
2. POST to `/api/books/[id]/locations`
3. Server validates coordinates and metadata
4. Stores location with user association
5. Map component fetches and displays locations

## Server vs Client Component Boundaries

### Server Components (RSC)
- `app/dashboard/page.tsx` - Dashboard with user stats
- `app/books/[id]/page.tsx` - Book detail page
- `app/api/**/*` - All API routes
- `components/books/BookCard.tsx` - Static book display
- Data fetching components with `async/await`

### Client Components
- `components/map/BookMap.tsx` - Interactive map
- `components/books/BookSearch.tsx` - Search with real-time filtering
- `components/auth/AuthForm.tsx` - Form handling and state
- `app/providers.tsx` - Context providers
- Components with browser APIs (geolocation, localStorage)

### Hybrid Approach
- Server component fetches initial data
- Client component handles interactivity
- Pass data as props or via React context

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-app.vercel.app"

# Google Books API
GOOGLE_BOOKS_API_KEY="your-google-books-api-key"

# Optional: Redis for caching
REDIS_URL="redis://user:password@host:6379"

# Optional: Analytics
VERCEL_ANALYTICS_ID="your-vercel-analytics-id"
```

## Key Architectural Decisions

1. **Type Safety**: Full TypeScript integration with Prisma types
2. **Performance**: Server components for initial load, client for interactivity
3. **Scalability**: Modular API design with proper separation of concerns
4. **Security**: JWT authentication, input validation, SQL injection prevention
5. **UX**: Progressive enhancement with client-side interactivity
6. **Deployment**: Vercel-optimized with environment-specific configs
