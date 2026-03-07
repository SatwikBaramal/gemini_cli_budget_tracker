# Mobile Migration Plan — React Native / Expo

> Ground-up rebuild of the Vivaranam Budget Tracker as a native mobile app.
> The existing Next.js backend (API routes on Vercel) stays as-is and serves as the API layer.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Backend Strategy](#3-backend-strategy)
4. [Authentication](#4-authentication)
5. [API Contract](#5-api-contract)
6. [Data Models](#6-data-models)
7. [Screen Map & Navigation](#7-screen-map--navigation)
8. [Component Migration Map](#8-component-migration-map)
9. [Shared Code](#9-shared-code)
10. [Native Equivalents for Web Libraries](#10-native-equivalents-for-web-libraries)
11. [Encryption & Security](#11-encryption--security)
12. [Offline Support](#12-offline-support)
13. [Environment & Configuration](#13-environment--configuration)
14. [Build & Distribution](#14-build--distribution)
15. [Phase Plan](#15-phase-plan)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Mobile App                      │
│          (React Native / Expo)                   │
│                                                  │
│  ┌───────────┐  ┌───────────┐  ┌─────────────┐  │
│  │  Screens  │  │  State    │  │  Services   │  │
│  │  (RN UI)  │  │  (Zustand)│  │  (API calls)│  │
│  └─────┬─────┘  └─────┬─────┘  └──────┬──────┘  │
│        └───────────────┴───────────────┘         │
│                        │                         │
│                   HTTPS (JWT)                    │
└────────────────────────┬────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│            Existing Next.js Backend              │
│              (Deployed on Vercel)                 │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ API      │  │ NextAuth │  │ MongoDB       │  │
│  │ Routes   │  │ (JWT)    │  │ (Mongoose)    │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ AES-256  │  │ OpenAI   │  │ ExcelJS       │  │
│  │ Encrypt  │  │ (GitHub) │  │ (Export)      │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
└─────────────────────────────────────────────────┘
```

**Key principle**: The mobile app is a pure client. All business logic (encryption, validation, AI, export) stays server-side. The app only renders UI and makes API calls.

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **Expo SDK 52+** | Managed workflow, OTA updates, EAS Build |
| Language | **TypeScript** | Matches existing codebase |
| Navigation | **Expo Router** | File-based routing (familiar from Next.js) |
| State | **Zustand** | Lightweight, no boilerplate, great TS support |
| UI Components | **React Native Paper 5** | Material Design 3, dark mode built-in |
| Styling | **NativeWind 4** (Tailwind for RN) | Reuse Tailwind class knowledge |
| Charts | **Victory Native** | Best RN charting lib, SVG-based |
| Animations | **React Native Reanimated 3** | 60fps native animations |
| Gestures | **React Native Gesture Handler** | Swipe-to-delete, pull-to-refresh |
| Storage | **AsyncStorage** | JWT token persistence, preferences |
| Secure Storage | **expo-secure-store** | Store auth tokens securely |
| HTTP | **Axios** or plain `fetch` | API calls to Vercel backend |
| Toast | **react-native-toast-message** | Notification toasts |
| Markdown | **react-native-markdown-display** | For AI chatbot responses |
| Calendar | **react-native-calendars** | Calendar view |
| Haptics | **expo-haptics** | Tactile feedback on actions |
| Biometrics | **expo-local-authentication** | Face ID / fingerprint lock |

---

## 3. Backend Strategy

### What stays unchanged

The entire Next.js backend remains deployed on Vercel:

- All 22 API routes (`/api/expenses`, `/api/goals`, `/api/income`, etc.)
- MongoDB connection and Mongoose models
- AES-256-GCM encryption/decryption (server-side only)
- OpenAI integration for AI chatbot
- ExcelJS for data export
- NextAuth for authentication

### What needs to change on the backend

1. **CORS headers** — Add to `middleware.ts` or individual routes:
   ```
   Access-Control-Allow-Origin: * (or specific mobile origins)
   Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
   Access-Control-Allow-Headers: Authorization, Content-Type
   ```

2. **Auth token handling** — NextAuth already uses JWT strategy. The mobile app sends the JWT as a `Bearer` token in the `Authorization` header instead of relying on cookies.

3. **Export endpoint** — The Excel export currently returns a binary blob. The mobile app will download this and use `expo-sharing` or `expo-file-system` to save/share the file.

4. **Streaming chat** — The AI chatbot uses SSE (`text/event-stream`). React Native supports `fetch` with streaming via `ReadableStream` or use a library like `react-native-sse`.

---

## 4. Authentication

### Current setup (NextAuth v5)

- **Strategy**: JWT (stateless)
- **Providers**: Credentials (email/password) + Google OAuth
- **Session shape**: `{ user: { id, email, name?, image? }, iat, exp }`
- **Secret**: `AUTH_SECRET` env var

### Mobile auth flow

```
┌─────────────┐     POST /api/auth/signin      ┌──────────────┐
│  Login       │ ─────────────────────────────► │  NextAuth    │
│  Screen      │     { email, password }        │  JWT issued  │
│              │ ◄───────────────────────────── │              │
│              │     { token, user }            │              │
└──────┬───────┘                                └──────────────┘
       │
       │ Store JWT in expo-secure-store
       │
       ▼
┌─────────────┐     GET /api/expenses           ┌──────────────┐
│  App         │ ─────────────────────────────► │  API Route   │
│  Screens     │   Authorization: Bearer <jwt>  │  Validates   │
│              │ ◄───────────────────────────── │  Returns data│
└──────────────┘                                └──────────────┘
```

**Implementation notes:**
- Call NextAuth's `POST /api/auth/callback/credentials` with `{ email, password }` to get a session JWT
- Store the JWT in `expo-secure-store` (encrypted on-device storage)
- Attach `Authorization: Bearer <token>` to every API request
- On 401 response, redirect to login screen
- Google OAuth: use `expo-auth-session` with `useAuthRequest` to get Google ID token, then exchange via NextAuth's Google provider callback
- Biometric lock (optional): gate app access behind Face ID / fingerprint using `expo-local-authentication`, token stays in secure store

### Backend change needed

NextAuth needs to accept Bearer tokens from the `Authorization` header (not just cookies). Add a helper that extracts the JWT from either cookies or the Authorization header:

```typescript
// In auth utility or middleware
function getToken(request: NextRequest): string | null {
  // Check cookie first (web)
  const cookieToken = request.cookies.get('next-auth.session-token')?.value;
  if (cookieToken) return cookieToken;

  // Check Authorization header (mobile)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}
```

---

## 5. API Contract

Every API call from the mobile app goes to the hosted backend. Base URL stored in config (e.g., `https://vivaranam.vercel.app`).

### Expenses

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/api/expenses?year=YYYY` | — | `[{ id, name, amount, type, date, year }]` |
| POST | `/api/expenses` | `{ name, amount, year }` | `{ id, name, amount, ... }` |
| DELETE | `/api/expenses/[id]?year=YYYY` | — | `{ success: true }` |
| GET | `/api/expenses/monthly?year=YYYY` | — | `[{ id, name, amount, month, date, year }]` |
| POST | `/api/expenses/monthly/[month]?year=YYYY` | `{ name, amount, year }` | `{ id, name, amount, ... }` |
| DELETE | `/api/expenses/monthly/[month]/[id]?year=YYYY` | — | `{ success: true }` |

### Income

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/api/income/monthly?year=YYYY` | — | `{ value: string }` |
| POST | `/api/income/monthly` | `{ income, year }` | `{ income }` |
| GET | `/api/income/monthly/overrides?year=YYYY` | — | `[{ id, month, year, override_amount, date }]` |
| POST | `/api/income/monthly/overrides` | `{ month, override_amount, year }` | `{ id, month, ... }` |
| DELETE | `/api/income/monthly/overrides/[id]?year=YYYY` | — | `{ success: true }` |

### Fixed Expenses

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/api/fixed-expenses?year=YYYY` | — | `[{ id, name, amount, applicable_months, overrides }]` |
| POST | `/api/fixed-expenses?year=YYYY` | `{ name, amount, applicable_months, year }` | `{ id, ... }` |
| PUT | `/api/fixed-expenses/[id]?year=YYYY` | `{ name, amount, applicable_months, year }` | `{ id, ... }` |
| DELETE | `/api/fixed-expenses/[id]?year=YYYY` | — | `{ success: true }` |
| POST | `/api/fixed-expenses/overrides?year=YYYY` | `{ fixed_expense_id, month, override_amount, year }` | `{ id, ... }` |
| DELETE | `/api/fixed-expenses/overrides/[id]?year=YYYY` | — | `{ success: true }` |

### Goals

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/api/goals` | `?status=active\|completed\|archived` (optional) | `[{ _id, name, targetAmount, currentAmount, deadline, status, contributions }]` |
| POST | `/api/goals` | `{ name, targetAmount, deadline, monthlySavingsTarget? }` | `{ _id, ... }` |
| PATCH | `/api/goals/[id]` | `{ name?, targetAmount?, status? }` or `{ contribution: { amount, date, note?, type } }` | `{ _id, ... }` |
| DELETE | `/api/goals/[id]` | — | `{ success: true }` |

### Export

| Method | Endpoint | Query | Response |
|---|---|---|---|
| GET | `/api/export/excel` | `?years=YYYY&months=1,2,3&ai=true` | Binary `.xlsx` blob |

### AI Chatbot

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/api/expenses/summarize` | `{ messages: [{ role, content }] }` | SSE stream (`text/event-stream`) |

### Other

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name?, email, password }` | `{ message, user }` |
| DELETE | `/api/user` | — | `{ success, deletionSummary }` |
| GET/POST | `/api/filter-presets?year=YYYY` | POST: `{ name, filters, year }` | `[{ id, name, filters }]` |
| DELETE | `/api/filter-presets/[id]` | — | `{ success: true }` |

---

## 6. Data Models

All monetary values are **encrypted server-side** (AES-256-GCM). The mobile app only sees decrypted values in API responses. No encryption logic needed on the client.

### Expense
```
id: string
name: string
amount: number (decrypted by API)
type: 'yearly' | 'monthly'
month?: number (1-12, only for monthly)
date?: string (ISO)
year: number
```

### FixedExpense
```
id: string
name: string
amount: number (decrypted)
applicable_months: number[] (1-12)
year: number
overrides: FixedExpenseOverride[]
```

### FixedExpenseOverride
```
id: string
fixed_expense_id: string
month: number (1-12)
override_amount: number (decrypted)
date: string
year: number
```

### MonthlyIncomeOverride
```
id: string
month: number (1-12)
year: number
override_amount: number (decrypted)
date: string
```

### Goal
```
_id: string
name: string
targetAmount: number (decrypted)
currentAmount: number (decrypted)
deadline: string (ISO)
monthlySavingsTarget?: number
status: 'active' | 'completed' | 'archived'
contributions: Contribution[]
```

### Contribution
```
amount: number (decrypted)
date: string (ISO)
note?: string
type: 'addition' | 'withdrawal'
```

### Setting (Income)
```
key: 'yearlyIncome' | 'monthlyIncome'
value: string (decrypted number as string)
year: number
```

### FilterPreset
```
id: string
name: string
filters: {
  searchQuery?: string
  dateRange?: { start: string, end: string }
  amountRange?: { min: number, max: number }
}
year: number
```

---

## 7. Screen Map & Navigation

### Navigation Structure

```
Root (Stack)
├── Auth Stack (unauthenticated)
│   ├── SignIn Screen
│   └── SignUp Screen
│
└── Main Stack (authenticated)
    └── Bottom Tab Navigator
        ├── Home Tab (Stack)
        │   ├── Dashboard Screen (yearly overview + charts)
        │   └── Expense Detail (if needed)
        │
        ├── Monthly Tab (Stack)
        │   ├── Monthly Overview Screen (swipeable month carousel)
        │   ├── Calendar View Screen
        │   └── Fixed Expenses Screen
        │
        ├── Goals Tab (Stack)
        │   ├── Goals List Screen
        │   ├── Goal Detail Screen (contributions history)
        │   └── Add/Edit Goal Screen
        │
        └── Settings Tab (Stack)
            ├── Settings Screen (income, theme, export, account)
            ├── Search Screen (filters + results)
            └── AI Chat Screen (FinBot)
```

### Screen → Web Page Mapping

| Mobile Screen | Web Equivalent | Data Dependencies |
|---|---|---|
| **SignIn** | `/sign-in` | None |
| **SignUp** | `/sign-up` | None |
| **Dashboard** | `/` (home page) | expenses, monthly expenses, fixed expenses, income |
| **Monthly Overview** | `/monthly` (current month view) | monthly income, income overrides, monthly expenses, fixed expenses |
| **Calendar View** | `/monthly` (calendar tab) | expenses, goals |
| **Fixed Expenses** | `/monthly` (fixed expenses manager) | fixed expenses, overrides |
| **Goals List** | `/` (goals section) | goals |
| **Goal Detail** | GoalCard + ContributionHistoryDialog | single goal with contributions |
| **Settings** | SettingsDialog | user settings, income |
| **Search** | SearchDialog | filter presets, expenses |
| **AI Chat** | ChatbotDialog / Summary.tsx | messages (streaming) |
| **Export** | ExportDataDialog | years, months selection → blob download |

---

## 8. Component Migration Map

### Direct Replacements

| Web Component | RN Equivalent | Notes |
|---|---|---|
| `<div>` | `<View>` | |
| `<span>`, `<p>` | `<Text>` | All text must be in `<Text>` |
| `<input>` | `<TextInput>` | or RN Paper's `<TextInput>` |
| `<button>` | `<Pressable>` or `<Button>` | RN Paper `<Button>` |
| `<img>` | `<Image>` | |
| `<ScrollView>` (web) | `<ScrollView>` / `<FlatList>` | Use FlatList for long lists |
| Radix Dialog | RN Paper `<Portal>` + `<Modal>` | or `<Dialog>` from RN Paper |
| Radix Accordion | RN Paper `<List.Accordion>` | |
| Radix Tabs | RN Paper `<SegmentedButtons>` or custom | |
| Tailwind classes | NativeWind classes | Most translate 1:1 |
| `lucide-react` | `lucide-react-native` | Same icon names |
| Framer Motion | `react-native-reanimated` | Different API, same concepts |
| Recharts (Pie/Line) | Victory Native | Different API |
| Sonner toasts | `react-native-toast-message` | |
| `react-markdown` | `react-native-markdown-display` | For FinBot responses |

### App-Specific Component Mapping

| Web Component | Mobile Approach |
|---|---|
| `Header.tsx` | Bottom tab navigator + screen headers |
| `Dashboard.tsx` | Dashboard screen with `<ScrollView>` + chart cards |
| `PieChartComponent.tsx` | Victory Native `<VictoryPie>` |
| `LineChartComponent.tsx` | Victory Native `<VictoryLine>` |
| `ExpenseList.tsx` | `<FlatList>` with `<Swipeable>` items |
| `SwipeableExpenseItem.tsx` | `react-native-gesture-handler` `<Swipeable>` |
| `QuickAddExpenseFAB.tsx` | RN Paper `<FAB>` |
| `MonthNavigationGrid.tsx` | Horizontal `<ScrollView>` with month chips |
| `CalendarView.tsx` | `react-native-calendars` `<Calendar>` |
| `BudgetProgressBar.tsx` | RN Paper `<ProgressBar>` or custom with Reanimated |
| `MonthlyExpenseSection.tsx` | Screen section with `<FlatList>` |
| `FixedExpensesManager.tsx` | Dedicated screen with add/edit forms |
| `GoalsSection.tsx` + `GoalCard.tsx` | `<FlatList>` of goal cards |
| `ManageSavingsDialog.tsx` | Bottom sheet (react-native-bottom-sheet) |
| `ContributionHistoryDialog.tsx` | Full screen or bottom sheet |
| `SearchDialog.tsx` | Dedicated search screen with filter chips |
| `Summary.tsx` (FinBot) | Chat screen with message bubbles |
| `ExportDataDialog.tsx` | Bottom sheet → download + share via `expo-sharing` |
| `SettingsDialog.tsx` | Settings screen with sections |
| `ThemeToggle.tsx` | RN Paper's theme system (automatic dark mode) |
| `IncomeInput.tsx` | Inline form in settings or monthly screen |

---

## 9. Shared Code

These files can be copied directly to the mobile project with zero or minimal changes:

### 100% Reusable

| File | Contents |
|---|---|
| `src/lib/formatters.ts` | `formatCurrency()`, `getMonthName()`, `formatDateTime()` |
| `src/lib/validation.ts` | All validation functions (income, month, amount, name, year, etc.) |

### Reusable as TypeScript types

Create a `shared/types.ts` in the mobile project with the interfaces from the web app:

- `Expense`, `FixedExpense`, `FixedExpenseOverride`
- `MonthlyIncomeOverride`, `Goal`, `Contribution`
- `Setting`, `FilterPreset`

### Not reusable (server-only)

- `src/lib/encryption.ts` — stays server-side, mobile never handles encryption
- `src/lib/mongodb.ts` — stays server-side
- `src/lib/auth.ts` — NextAuth config stays server-side
- All `src/lib/models/*.ts` — Mongoose schemas stay server-side
- All `src/app/api/**/route.ts` — API routes stay server-side

---

## 10. Native Equivalents for Web Libraries

| Web Library | RN Equivalent | Install |
|---|---|---|
| `next` (routing) | `expo-router` | `npx expo install expo-router` |
| `next-auth` | Custom JWT + `expo-secure-store` | `npx expo install expo-secure-store` |
| `tailwindcss` | `nativewind` | `npm install nativewind tailwindcss` |
| `@radix-ui/*` | `react-native-paper` | `npm install react-native-paper` |
| `recharts` | `victory-native` + `react-native-svg` | `npm install victory-native react-native-svg` |
| `framer-motion` | `react-native-reanimated` | `npx expo install react-native-reanimated` |
| `lucide-react` | `lucide-react-native` + `react-native-svg` | `npm install lucide-react-native` |
| `sonner` | `react-native-toast-message` | `npm install react-native-toast-message` |
| `react-markdown` | `react-native-markdown-display` | `npm install react-native-markdown-display` |
| `exceljs` (export) | Backend generates, app downloads via `expo-file-system` + `expo-sharing` | `npx expo install expo-file-system expo-sharing` |
| Browser `fetch` SSE | `react-native-sse` or manual `fetch` + `ReadableStream` | `npm install react-native-sse` |

---

## 11. Encryption & Security

### Server-side (no changes)

All encryption stays on the backend:
- AES-256-GCM encryption of monetary values
- bcryptjs password hashing
- `ENCRYPTION_KEY` env var (64-char hex, 256-bit key)

### Client-side security

| Concern | Solution |
|---|---|
| JWT storage | `expo-secure-store` (Keychain on iOS, EncryptedSharedPreferences on Android) |
| API calls | HTTPS only, JWT in Authorization header |
| Biometric lock | `expo-local-authentication` gates app access |
| Screen recording | Optional: `expo-screen-capture` to prevent screenshots |
| Certificate pinning | Optional: configure in `app.json` for extra security |
| Token refresh | Check JWT expiry, redirect to login on 401 |

---

## 12. Offline Support

### Phase 1 (Launch without offline)

The app requires network connectivity. Show a friendly "No internet connection" screen when offline. This matches the current web app behavior.

### Phase 2 (Future enhancement)

| Feature | Implementation |
|---|---|
| Read cache | Cache last-fetched data in AsyncStorage, show stale data with "offline" badge |
| Offline add | Queue new expenses in AsyncStorage, sync when back online |
| Conflict resolution | Last-write-wins (server timestamp) for simplicity |
| Sync indicator | Show sync status icon in header |

---

## 13. Environment & Configuration

### Mobile app config (`app.json` / `app.config.ts`)

```json
{
  "expo": {
    "name": "Vivaranam",
    "slug": "vivaranam",
    "scheme": "vivaranam",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-local-authentication"
    ]
  }
}
```

### Environment variables (mobile)

Only one env var needed on the mobile side:

```
API_BASE_URL=https://vivaranam.vercel.app
```

All secrets (`MONGODB_URI`, `ENCRYPTION_KEY`, `AUTH_SECRET`, `GITHUB_TOKEN`) stay server-side only.

### Backend env vars (unchanged)

```
MONGODB_URI=<connection string>
ENCRYPTION_KEY=<64-char hex>
AUTH_SECRET=<random string>
GOOGLE_CLIENT_ID=<optional>
GOOGLE_CLIENT_SECRET=<optional>
GITHUB_TOKEN=<optional, for AI features>
```

---

## 14. Build & Distribution

### Development

```bash
# Install
npx create-expo-app vivaranam-mobile --template tabs
cd vivaranam-mobile

# Run on simulators
npx expo start
# Press 'i' for iOS simulator, 'a' for Android emulator
```

### Production builds (EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for stores
eas build --platform ios      # Requires Apple Developer ($99/yr)
eas build --platform android  # Requires Google Play ($25 one-time)
```

### OTA Updates

Expo supports over-the-air JS updates without going through the App Store:

```bash
eas update --branch production --message "Bug fix for expense totals"
```

### Store Requirements

| Store | Requirements |
|---|---|
| **Apple App Store** | Apple Developer Program ($99/yr), Xcode for screenshots, privacy policy URL, app review (3-7 days first time) |
| **Google Play Store** | Google Developer account ($25), signed AAB, privacy policy URL, content rating questionnaire |

---

## 15. Phase Plan

### Phase 1 — Foundation (Week 1-2)

- [ ] Expo project setup with TypeScript, NativeWind, React Native Paper
- [ ] Expo Router file-based navigation structure
- [ ] API service layer (base URL config, JWT auth headers, error handling)
- [ ] Auth flow: sign in, sign up, token storage, auto-login
- [ ] Add CORS headers to Next.js backend
- [ ] Add Bearer token support to NextAuth

### Phase 2 — Core Screens (Week 3-5)

- [ ] **Dashboard screen**: yearly expenses list, income display, summary stats
- [ ] **Monthly screen**: month carousel, expense list with swipe-to-delete, add expense form
- [ ] **Fixed expenses screen**: list, add/edit/delete, month selection, overrides
- [ ] **Income settings**: base income input, monthly override management
- [ ] Budget progress bars with Reanimated animations
- [ ] FAB for quick expense add

### Phase 3 — Goals & Charts (Week 6-7)

- [ ] **Goals list screen**: active/completed/archived filter tabs
- [ ] **Goal detail screen**: progress visualization, contribution history
- [ ] **Add/edit goal**: form with deadline picker
- [ ] **Manage savings**: add contribution / withdrawal bottom sheet
- [ ] **Charts**: Victory Native pie chart (expense breakdown) + line chart (monthly trend)

### Phase 4 — Advanced Features (Week 8-9)

- [ ] **Search screen**: text search, date/amount range filters, saved presets
- [ ] **AI Chat screen**: FinBot with SSE streaming, message bubbles, markdown rendering
- [ ] **Export**: year/month selection → download Excel → share via system share sheet
- [ ] **Calendar view**: `react-native-calendars` with expense/goal markers
- [ ] **Settings screen**: theme toggle, account deletion, about/version

### Phase 5 — Polish & Ship (Week 10-12)

- [ ] Biometric lock (Face ID / fingerprint)
- [ ] Dark mode (RN Paper theme system)
- [ ] Loading skeletons and empty states
- [ ] Haptic feedback on key actions
- [ ] Error boundaries and offline detection
- [ ] Real device testing (iOS + Android)
- [ ] App Store screenshots and metadata
- [ ] Submit to App Store and Google Play

---

## Appendix: Project Structure

```
vivaranam-mobile/
├── app/                          # Expo Router screens
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/
│   │   ├── index.tsx             # Dashboard
│   │   ├── monthly.tsx           # Monthly overview
│   │   ├── goals.tsx             # Goals list
│   │   └── settings.tsx          # Settings
│   ├── goals/
│   │   └── [id].tsx              # Goal detail
│   ├── monthly/
│   │   ├── calendar.tsx          # Calendar view
│   │   └── fixed-expenses.tsx    # Fixed expenses manager
│   ├── chat.tsx                  # AI chatbot
│   ├── search.tsx                # Search & filter
│   ├── export.tsx                # Export dialog
│   └── _layout.tsx               # Root layout
├── components/
│   ├── ExpenseItem.tsx
│   ├── MonthCarousel.tsx
│   ├── BudgetProgressBar.tsx
│   ├── GoalCard.tsx
│   ├── PieChart.tsx
│   ├── LineChart.tsx
│   ├── FAB.tsx
│   └── ...
├── services/
│   ├── api.ts                    # Axios/fetch instance with JWT
│   ├── auth.ts                   # Login, register, token management
│   ├── expenses.ts               # Expense API calls
│   ├── income.ts                 # Income API calls
│   ├── goals.ts                  # Goals API calls
│   └── export.ts                 # Export API call + file handling
├── stores/
│   ├── authStore.ts              # Zustand auth state
│   ├── expenseStore.ts           # Expenses state
│   ├── incomeStore.ts            # Income state
│   └── goalStore.ts              # Goals state
├── shared/
│   ├── types.ts                  # TypeScript interfaces (from web app)
│   ├── formatters.ts             # Copied from web app
│   └── validation.ts             # Copied from web app
├── app.json
├── tsconfig.json
└── package.json
```
