# Budget Tracking Application - Technical Context

## Project Overview

This is a comprehensive personal finance management application built with Next.js 15.5, TypeScript, and MongoDB. The application provides dual-tracking capabilities (yearly and monthly), intelligent expense management with fixed expenses and override systems, and an AI-powered financial advisor with temporal awareness.

## Architecture

### Technology Stack

**Frontend:**
- Next.js 15.5 (App Router architecture)
- TypeScript 5.0
- React 19.1
- Tailwind CSS 4.0
- shadcn/ui components (Radix UI primitives)
- Recharts for data visualization
- Lucide React for icons

**Backend:**
- Next.js API Routes (serverless functions)
- MongoDB with Mongoose ODM
- OpenAI API via GitHub Models for AI features

**Development:**
- ESLint for code quality
- TypeScript for type safety
- Hot Module Replacement for fast development

## Application Structure

### Pages

1. **Yearly Tracking Page** (`src/app/page.tsx`)
   - Main landing page
   - Yearly income input with auto-conversion to monthly
   - Yearly expense management (add, delete, sort)
   - Dashboard with summary cards and pie chart
   - AI chatbot (FinBot) for insights

2. **Monthly Tracking Page** (`src/app/monthly/page.tsx`)
   - Detailed month-by-month expense tracking
   - Monthly income management (independent from yearly)
   - Two view modes:
     - **Current Month Focus**: Prominent display of selected month
     - **All Months Accordion**: Expandable view of all 12 months
   - Fixed expenses manager
   - Month navigation grid
   - Budget progress bars

### Data Models (MongoDB Schemas)

**1. Setting** (`src/lib/models/Setting.ts`)
```typescript
{
  key: string (unique)    // 'yearlyIncome' or 'monthlyIncome'
  value: string           // stored as string, converted to number
  timestamps: true
}
```

**2. Expense** (`src/lib/models/Expense.ts`)
```typescript
{
  name: string
  amount: number
  type: 'yearly' | 'monthly'
  month?: number          // 1-12, only for monthly expenses
  date?: string           // ISO string
  timestamps: true
}
```

**3. FixedExpense** (`src/lib/models/FixedExpense.ts`)
```typescript
{
  name: string
  amount: number
  applicableMonths: number[]  // Array of month numbers (1-12)
  timestamps: true
}
```

**4. FixedExpenseOverride** (`src/lib/models/FixedExpenseOverride.ts`)
```typescript
{
  fixedExpenseId: ObjectId    // Reference to FixedExpense
  month: number               // 1-12
  overrideAmount: number      // Different amount for this specific month
  date: string                // ISO string
  timestamps: true
}
```

### API Routes

**Income Management:**
- `GET/POST /api/income` - Yearly income
- `GET/POST /api/income/monthly` - Monthly income

**Expense Management:**
- `GET/POST /api/expenses` - Yearly expenses
- `DELETE /api/expenses/[id]` - Delete yearly expense
- `GET /api/expenses/monthly` - All monthly expenses
- `POST /api/expenses/monthly/[month]` - Add expense to specific month
- `DELETE /api/expenses/monthly/[month]/[id]` - Delete monthly expense

**Fixed Expenses:**
- `GET/POST /api/fixed-expenses` - List/Create fixed expenses
- `PUT /api/fixed-expenses/[id]` - Update fixed expense
- `DELETE /api/fixed-expenses/[id]` - Delete fixed expense
- `POST /api/fixed-expenses/overrides` - Create override
- `DELETE /api/fixed-expenses/overrides/[id]` - Remove override

**AI Chatbot:**
- `POST /api/expenses/summarize` - Chat with FinBot

## Key Features Implementation

### 1. Dual Tracking System

**Yearly Tracking:**
- Users set yearly income (e.g., ₹13,00,000)
- Automatically divides by 12 for monthly view (₹1,08,333)
- Add yearly recurring expenses
- View aggregated dashboard

**Monthly Tracking:**
- Set monthly income independently (not derived from yearly)
- Track expenses for each specific month (January through December)
- Add both one-time and fixed/recurring expenses
- View month-by-month breakdown

### 2. Fixed Expenses System

**Concept:**
- Create an expense once, apply to multiple months
- Example: Rent (₹15,000) applied to all 12 months
- Example: Insurance (₹5,000) applied to Jan, Apr, Jul, Oct (quarterly)

**Override Mechanism:**
- Modify the amount for a specific month without affecting others
- Example: Rent increases from ₹15,000 to ₹16,000 in March only
- Original amount preserved for other months
- Override can be reverted to return to original amount

**Visual Indicators:**
- Fixed expenses: Blue background with pin icon
- Overridden expenses: Orange "Modified" badge
- Regular expenses: White background

### 3. AI Financial Advisor (FinBot)

**Location:** Dashboard component (`src/components/Summary.tsx`)

**Capabilities:**
- Natural language financial queries
- Spending pattern analysis
- Budget recommendations (50/30/20 rule)
- Category-based expense grouping
- Trend identification
- Future budget forecasting
- Personalized savings strategies

**Temporal Awareness:**
- Understands current date and month
- Differentiates between:
  - **Past months**: Actual spending already incurred
  - **Current month**: In-progress with remaining budget
  - **Future months**: Planned/budgeted expenses

**Implementation Details:**
- Uses OpenAI API via GitHub Models
- Model: gpt-4.1-nano (or gpt-5-chat)
- Temperature: 0.5 (for consistent financial advice)
- System prompt includes:
  - Complete financial data (income, expenses, fixed expenses, overrides)
  - Monthly budget health analysis with temporal labels
  - Current month progress tracking
  - Future budget forecast
  - Comprehensive guidelines for financial advice

**Context Optimization:**
- Condensed formatting to minimize token usage
- Optimized for GitHub Models free tier rate limits
- Estimated ~2500 tokens per request

### 4. Budget Health Tracking

**Monthly Analysis:**
For each month (1-12), calculate:
- Regular expenses total
- Fixed expenses total (with overrides applied)
- Total spent = regular + fixed
- Remaining = income - total spent
- Percentage spent
- Status: SURPLUS or DEFICIT
- Temporal label: PAST, CURRENT, or FUTURE

**Current Month Progress:**
- Day X of Y (completion percentage)
- Days remaining in month
- Amount spent so far
- Remaining budget
- Daily budget available (remaining ÷ days left)

**Future Month Forecast:**
- For each future month:
  - Planned expenses (fixed + manually added)
  - Available budget (income - planned)
  - Allocation suggestions from AI

### 5. Month Navigation System

**Grid View:**
- 12 cards representing each month
- Color-coded status:
  - Green: Surplus (under budget)
  - Red: Deficit (over budget)
- Quick stats displayed:
  - Month name
  - Total spent
  - Remaining amount
- Click to navigate to that month

**Month Selection:**
- Current month selected by default
- One-click switching between months
- Maintains state when toggling view modes

### 6. View Modes

**Current Month Focus (Default):**
- Large, prominent display of selected month
- Budget progress bar
- Detailed expense breakdown
- Fixed expenses manager below
- Month navigation grid at bottom
- Toggle button to switch to All Months view

**All Months Accordion:**
- Expandable/collapsible sections for each month
- Quick summary in header (spent, remaining)
- Full expense section when expanded
- Fixed expenses manager at top
- Toggle button to return to Current Month view

## Data Flow

### Adding a Monthly Expense

1. User fills form in `MonthlyExpenseSection` component
2. `onAddExpense(monthNumber, {name, amount})` called
3. Frontend sends POST to `/api/expenses/monthly/[month]`
4. API route:
   - Connects to MongoDB
   - Creates expense document with `type: 'monthly'` and `month: monthNumber`
   - Sets `date: new Date().toISOString()`
   - Returns created expense with ID
5. Frontend updates local state
6. UI re-renders with new expense

### Creating a Fixed Expense

1. User opens Fixed Expenses Manager dialog
2. Enters name, amount, selects applicable months
3. Clicks Save → `onAdd({name, amount, applicable_months})` called
4. Frontend sends POST to `/api/fixed-expenses`
5. API route creates FixedExpense document
6. Frontend updates local state
7. Fixed expense automatically appears in all selected months

### Overriding a Fixed Expense

1. User clicks Edit icon on fixed expense in a specific month
2. Enters new amount
3. Clicks Save → `onOverrideFixedExpense(fixedExpenseId, month, overrideAmount)` called
4. Frontend sends POST to `/api/fixed-expenses/overrides`
5. API creates FixedExpenseOverride document
6. Frontend updates local state to include override
7. UI shows modified amount with orange badge
8. Other months continue showing original amount

### AI Chat Interaction

1. User types message in Summary component
2. Frontend sends POST to `/api/expenses/summarize` with messages array
3. API route:
   - Fetches all financial data (income, expenses, fixed expenses, overrides)
   - Calculates temporal categorization (past/current/future months)
   - Builds comprehensive system prompt with:
     - Current date and temporal context
     - All financial data formatted
     - Budget health analysis with temporal labels
     - Current month progress
     - Future budget forecast
     - AI capabilities and guidelines
   - Sends to OpenAI API
   - Returns AI response
4. Frontend displays response in chat
5. Conversation history maintained for context

## State Management

**Strategy:** React Hooks (useState, useEffect)

**No global state manager** (Redux, Zustand, etc.) - lightweight approach

**State Location:**
- Page-level components manage their own state
- Props passed down to child components
- API calls made directly from components
- State updates trigger re-renders

**Data Fetching:**
- On component mount (useEffect with empty deps)
- After mutations (add, update, delete)
- No caching layer (always fetch fresh data)

## Styling Approach

**Tailwind CSS Utility-First:**
- Inline utility classes for styling
- Responsive modifiers (sm:, md:, lg:)
- Custom colors and themes in `tailwind.config`

**shadcn/ui Components:**
- Pre-built accessible components (Button, Card, Dialog, Input, etc.)
- Based on Radix UI primitives
- Customizable via Tailwind classes
- Located in `src/components/ui/`

**Design System:**
- Color coding:
  - Blue: Fixed expenses
  - Orange: Overrides/modifications
  - Green: Positive/surplus
  - Red: Negative/deficit
  - Gray: Neutral/inactive
- Consistent spacing and typography
- Shadow and border radius for depth

## Database Connection

**MongoDB via Mongoose:**
- Connection established in `src/lib/mongodb.ts`
- Connection caching to avoid multiple connections in serverless
- Global cache object stores connection across requests
- Automatic reconnection handling

## Performance Considerations

**Optimizations:**
- Parallel data fetching (Promise.all)
- Lean queries (`.lean()`) for better performance
- Indexed fields in schemas (month, type, fixedExpenseId)
- Caching headers on API responses
- Conditional rendering to minimize DOM updates

**Bundle Size:**
- Next.js automatic code splitting
- Dynamic imports where applicable
- Tree-shaking of unused code
- Optimized production builds

## Security

**API Routes:**
- Server-side only (not exposed to client)
- Input validation on all endpoints
- Error handling without exposing internals

**Database:**
- Credentials in environment variables
- No SQL injection risk (Mongoose ODM)
- Connection string not in code

**Client-Side:**
- No sensitive data in localStorage
- API keys never exposed to frontend
- XSS protection via React (automatic escaping)

## Future Enhancement Opportunities

1. **User Authentication:** Multi-user support with auth
2. **Data Export:** CSV/PDF reports
3. **Budget Goals:** Set and track savings goals
4. **Recurring Transactions:** Auto-add expenses at intervals
5. **Mobile App:** React Native version
6. **Bank Integration:** Import transactions via API
7. **Categories:** Formal category system (currently AI-inferred)
8. **Notifications:** Budget alerts and reminders
9. **Multi-Currency:** Support for different currencies
10. **Collaborative Budgets:** Shared household budgets

## Development Workflow

**Running Locally:**
```bash
npm run dev          # Development server on port 3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

**Environment Setup:**
1. Copy `.env.example` to `.env.local`
2. Add MongoDB URI
3. Add GitHub Token (optional, for AI)
4. Run `npm install`
5. Run `npm run dev`

**Code Organization:**
- Components in `src/components/`
- Pages in `src/app/`
- API routes in `src/app/api/`
- Utilities in `src/lib/`
- Models in `src/lib/models/`

## Deployment

**Recommended Platform:** Vercel

**Steps:**
1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

**Environment Variables Needed:**
- `MONGODB_URI`
- `GITHUB_TOKEN` (for AI features)

**Considerations:**
- Serverless functions have cold starts
- MongoDB connection caching handles serverless well
- API routes automatically become serverless functions

## Troubleshooting

**Common Issues:**

1. **MongoDB connection fails:**
   - Check MONGODB_URI is correct
   - Ensure IP is whitelisted in MongoDB Atlas
   - Verify network connectivity

2. **AI not responding:**
   - Check GITHUB_TOKEN is valid
   - Verify API rate limits not exceeded
   - Check console for errors

3. **Expenses not saving:**
   - Check API route logs
   - Verify MongoDB connection
   - Check for validation errors

4. **UI not updating:**
   - Check state management in component
   - Verify API response includes updated data
   - Check browser console for errors

## Maintenance

**Regular Tasks:**
- Update dependencies (`npm update`)
- Monitor MongoDB storage
- Review API rate limits (GitHub Models)
- Check for security vulnerabilities (`npm audit`)
- Optimize database indexes if queries slow

---

**Last Updated:** October 2025  
**Next.js Version:** 15.5.3  
**Database:** MongoDB with Mongoose ODM  
**AI Provider:** OpenAI via GitHub Models
