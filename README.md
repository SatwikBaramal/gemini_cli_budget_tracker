# Vivaranam - Budget Tracking Application

> A comprehensive personal finance management system with AI-powered insights, savings goals, and intelligent budget forecasting

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?logo=mongodb)](https://www.mongodb.com/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-5.0-purple?logo=next.js)](https://next-auth.js.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

##  Overview

**Vivaranam** (meaning "details" in Sanskrit) is a powerful, modern budget tracking application that helps you take control of your finances through intelligent tracking, AI-powered insights, savings goals management, and predictive forecasting. Built with Next.js 15 and TypeScript, featuring secure authentication, a sophisticated dual-tracking system, and an AI financial advisor powered by OpenAI.

##  Key Features

###  Secure Authentication
- **Multiple Sign-In Methods**: Email/password credentials and Google OAuth integration
- **User Management**: Secure registration, sign-in, and session management
- **Protected Routes**: Middleware-based authentication for all financial data
- **User Isolation**: Each user's data is completely isolated and secure
- **NextAuth v5**: Latest authentication framework with JWT session strategy

### Dual Tracking System
- **Yearly Tracking**: Set yearly income with automatic monthly conversion and track recurring annual expenses
- **Monthly Tracking**: Independent monthly income management with granular expense tracking for each month (Jan-Dec)
- **Monthly Income Overrides**: Customize income for specific months to handle irregular income, bonuses, or seasonal variations
- **Multi-Year Support**: Track budgets across different years with year selector

###  Smart Expense Management
- **One-Time Expenses**: Add, edit, and delete expenses for specific months
- **Fixed/Recurring Expenses**: Create expenses that automatically apply to selected months
- **Override System**: Modify fixed expense amounts for specific months without affecting other months
- **Category Recognition**: Intelligent expense categorization for better insights
- **Expense Form**: User-friendly interface for adding and editing expenses with date and amount validation

###  Savings Goals Management
- **Goal Creation**: Set savings goals with target amounts and deadlines
- **Contribution Tracking**: Add money to or withdraw money from goals with detailed transaction history
- **Progress Visualization**: Visual progress bars showing percentage completion
- **Monthly Savings Target**: Automatic calculation of required monthly savings to meet deadlines
- **Goal Status Management**: Mark goals as active, completed, or archived
- **Contribution History**: View complete transaction history with dates, amounts, and notes
- **Goal Cards**: Beautiful card-based UI showing goal progress at a glance

###  Advanced Search & Filtering
- **Real-time Search**: Search expenses by name with instant results
- **Date Range Filtering**: Filter expenses by custom date ranges
- **Amount Range Filtering**: Filter expenses by minimum and maximum amounts
- **Filter Presets**: Save frequently used filter combinations for quick access
- **Preset Management**: Create, load, and delete filter presets
- **Active Filter Indicators**: Visual indicators when filters are applied
- **Search Results Display**: Dedicated component for displaying filtered results

###  AI Financial Advisor (FinBot)
- **Temporal Awareness**: Distinguishes between past spending, current progress, and future plans
- **Personalized Insights**: Analyzes spending patterns and identifies trends
- **Budget Recommendations**: Applies 50/30/20 rule and industry-standard spending percentages
- **Predictive Forecasting**: Calculates available budget and suggests optimal allocation
- **Goal Planning**: Helps set and achieve financial objectives with actionable steps
- **Powered by OpenAI**: Uses GPT models through GitHub Models integration
- **Markdown Formatting**: Rich formatted responses with proper structure

###  Advanced Analytics & Visualizations
- **Real-time Calculations**: Instant updates to all financial metrics
- **Month-over-Month Analysis**: Track spending trends across months
- **Budget Health Indicators**: Visual feedback on surplus/deficit status
- **Progress Tracking**: Daily budget monitoring for current month
- **Future Projections**: View available budget for upcoming months
- **Multiple Chart Types**: 
  - Pie charts for expense category distribution
  - Line charts for trend analysis over time
  - Income vs Expense comparison charts
  - Budget progress bars with percentage indicators

###  Data Export & Portability
- **Excel Export**: Download complete budget data in professionally formatted Excel workbooks
  - Multi-year selection capability
  - Separate sheets for monthly expenses, yearly expenses, fixed expenses, income, and goals
  - Industry-standard formatting with currency symbols, frozen headers, and color coding
  - Includes all contributions and transaction history
  - Automatic sheet generation for months with data
  - Professional summary statistics and calculations
  - Export dialog with year selection interface

###  Modern User Interface
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices
- **Interactive Charts**: Visual expense distribution with pie charts and line charts
- **Month Navigation Grid**: Quick access to any month with color-coded status indicators
- **Two View Modes**: 
  - Current Month Focus: Detailed view with prominent display
  - All Months Accordion: Comprehensive overview of entire year
- **Clean & Intuitive**: Built with shadcn/ui components and Tailwind CSS 4.0
- **Loading States**: Beautiful coin loading animations and skeleton loaders
- **Toast Notifications**: Real-time feedback using Sonner for all actions
- **Dialog-based Workflows**: Modal dialogs for complex operations
- **Badge Components**: Visual indicators for status and categories
- **Table Views**: Organized data display with sortable columns

##  Technology Stack

### Frontend
- **Framework**: Next.js 15.5 (App Router with React 19)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.0 with Typography plugin
- **UI Components**: shadcn/ui (built on Radix UI primitives)
  - Accordion, Dialog, Button, Input, Label, Card, Progress, Badge, Table
- **Charts**: Recharts 3.2 for data visualization
- **Icons**: Lucide React for consistent iconography
- **Markdown**: react-markdown with remark-gfm for AI responses
- **Notifications**: Sonner for toast notifications
- **State Management**: React 19 Hooks and Context

### Backend
- **Runtime**: Node.js 20+
- **Database**: MongoDB with Mongoose 8.19 ODM
- **Authentication**: NextAuth.js v5 (next-auth beta)
  - Credentials Provider for email/password
  - Google OAuth Provider
  - JWT session strategy
- **API**: Next.js API Routes (serverless functions)
- **AI Integration**: OpenAI API via GitHub Models
- **Password Hashing**: bcryptjs for secure password storage
- **Excel Generation**: ExcelJS 4.4 for data export

### Development & Testing
- **Package Manager**: npm
- **Testing Framework**: Jest 30 with React Testing Library
  - Component tests for UI validation
  - API endpoint tests
  - Mock implementations for external services
- **Test Environment**: jsdom for DOM simulation
- **Linting**: ESLint 9 with Next.js configuration
- **Type Checking**: TypeScript with strict mode
- **Build Tool**: Next.js built-in compilation with Turbopack support

##  Getting Started

### Prerequisites
- **Node.js 18+** and npm (Node.js 20+ recommended)
- **MongoDB instance** (local or MongoDB Atlas cloud - free tier available)
- **Google OAuth credentials** (optional, for Google sign-in - completely free)
- **GitHub Token** (optional, for AI features via GitHub Models - free tier available)

### Quick Start

The application comes with sensible defaults and can be run with minimal configuration. Authentication with email/password works out of the box - Google OAuth and AI features are optional enhancements.

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd budget_tracking_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # MongoDB
   MONGODB_URI=your_mongodb_connection_string
   
   # NextAuth Configuration (completely free!)
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=generate_random_32char_string
   
   # Data Encryption (REQUIRED for privacy)
   ENCRYPTION_KEY=your_64_character_hex_encryption_key
   
   # Google OAuth (optional - for Google sign-in)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # AI Features (optional)
   GITHUB_TOKEN=your_github_token_for_ai_features
   ```
   
   **Generate NEXTAUTH_SECRET**:
   ```bash
   # Using OpenSSL
   openssl rand -base64 32
   
   # Or using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   
   **Generate ENCRYPTION_KEY** (Required for encrypting sensitive financial data):
   ```bash
   # Using Node.js (generates 64-character hex key)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
   **Important**: Keep this key secure and backed up. All financial data (income, expenses, goals) is encrypted with this key. If lost, encrypted data cannot be recovered.
   
   **Setup Google OAuth** (optional): See [AUTH_SETUP.md](AUTH_SETUP.md) for detailed Google OAuth setup instructions. You can skip this if you only want email/password authentication.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Seed Test Data (Optional)

To populate your database with realistic test data for 2025:

```bash
npm run seed
```

This will create:
- 8 fixed expenses (rent, utilities, subscriptions, etc.)
- 120+ monthly expenses across Jan-Oct with varied categories
- 3 yearly expenses
- 3 fixed expense overrides for realistic variations
- Income data (₹40,000/month, ₹4,80,000/year)

**Note**: The seed script will clear all existing 2025 data before populating new data.

### Build for Production

```bash
npm run build
npm start
```

### Development Scripts

```bash
# Linting
npm run lint

# Database migration scripts (if needed)
npm run migrate              # Migrate to MongoDB from other sources
npm run migrate:year         # Add year field to existing data
npm run migrate:userid       # Add userId to existing data
npm run fix:indexes          # Fix MongoDB indexes
npm run verify:userid        # Verify userId coverage
npm run check:settings       # Find orphaned settings
npm run audit:all           # Comprehensive data audit
```

##  Usage Guide

### Getting Started with Vivaranam

#### 1. **Create Your Account**
   - Sign up with email and password, or use Google OAuth for quick access
   - Your data is completely isolated and secure
   - No credit card required

#### 2. **Choose Your Tracking Mode**
   - Use **Yearly Tracking** (main page `/`) for high-level annual planning
   - Use **Monthly Tracking** (`/monthly`) for detailed month-by-month management
   - Switch between views using the navigation tabs

#### 3. **Set Your Income**
   - Enter yearly income (auto-converts to monthly) or set monthly income directly
   - Update anytime as your income changes
   - **Use Monthly Income Overrides** for months with irregular income:
     - Click "Customize Monthly Income" button
     - Set different income for specific months (bonuses, seasonal variations)
     - Overrides are clearly marked with green indicators

#### 4. **Add Your Expenses**
   - **For recurring expenses**: Use Fixed Expenses Manager
     - Create expenses that auto-apply to selected months
     - Perfect for rent, subscriptions, utilities
     - Easily edit or override amounts for specific months
   - **For one-time expenses**: Add directly to specific months
     - Use the expense form with date, amount, and category
     - Edit or delete expenses as needed
   - **Visual Distinction**: Fixed expenses show with blue background and pin icon

#### 5. **Set Savings Goals**
   - Navigate to the Goals section
   - Click "Create New Goal" to set up a savings target:
     - Name your goal (e.g., "Emergency Fund", "Vacation")
     - Set target amount and deadline
     - System calculates required monthly savings
   - **Manage Your Goals**:
     - Add contributions when you save money
     - Withdraw if needed (tracked separately)
     - View complete contribution history
     - Archive completed goals
   - Track progress with visual progress bars

#### 6. **Search & Filter Expenses**
   - Use the Search & Filter panel to find specific expenses
   - **Filter by**:
     - Name/description (real-time search)
     - Date range (custom start and end dates)
     - Amount range (min and max sliders)
   - **Save Filter Presets** for frequently used searches:
     - Example: "High-value expenses (>₹10,000)"
     - Example: "Grocery expenses for Q1"
   - Quick access to saved presets

#### 7. **Monitor Your Budget**
   - View real-time calculations of spending vs. income
   - Check budget health for each month (surplus in green, deficit in red)
   - Use month navigation grid to quickly jump between months
   - See daily remaining budget for current month
   - View future budget availability for planning

#### 8. **Visualize Your Data**
   - **Pie Charts**: See expense distribution by category
   - **Line Charts**: Track spending trends over time
   - **Progress Bars**: Monitor budget usage and savings goals
   - **Income vs Expense Charts**: Compare earnings and spending

#### 9. **Get AI Insights (FinBot)**
   - Open the AI Financial Advisor panel
   - Ask questions in natural language
   - Get personalized recommendations based on your data
   - Receive markdown-formatted, structured responses

#### 10. **Export Your Data**
   - Click "Export Data" in the header
   - Select year(s) to export
   - Download professionally formatted Excel workbook
   - Includes all expenses, income, goals, and statistics

### Example Queries for FinBot

**Budget Analysis:**
- "How much money do I have left for November?"
- "Which months did I overspend and why?"
- "What's my spending pattern over the last 6 months?"

**Financial Planning:**
- "Where should I allocate my remaining budget?"
- "Help me create a savings plan for ₹50,000"
- "What's the best way to reduce my expenses?"

**Insights & Trends:**
- "What's my average monthly spending on groceries?"
- "Which category am I spending the most on?"
- "How does my current spending compare to the 50/30/20 rule?"

**Goal Planning:**
- "Can I afford to save ₹15,000 per month?"
- "When can I reach my savings goal of ₹2,00,000?"
- "Suggest a realistic monthly savings target"

## 📁 Project Structure

```
budget_tracking_app/
├── src/
│   ├── app/                        # Next.js 15 App Router
│   │   ├── api/                    # API Routes (serverless functions)
│   │   │   ├── auth/               # Authentication endpoints
│   │   │   │   ├── [...nextauth]/  # NextAuth.js handler
│   │   │   │   └── register/       # User registration
│   │   │   ├── expenses/           # Expense CRUD operations
│   │   │   │   ├── [id]/           # Single expense operations
│   │   │   │   ├── monthly/        # Monthly expense queries
│   │   │   │   ├── summarize/      # AI summarization endpoint
│   │   │   │   └── route.ts        # All expenses endpoint
│   │   │   ├── export/             # Data export endpoints
│   │   │   │   └── excel/          # Excel export handler
│   │   │   ├── filter-presets/     # Search filter presets
│   │   │   │   ├── [id]/           # Single preset operations
│   │   │   │   └── route.ts        # All presets endpoint
│   │   │   ├── fixed-expenses/     # Fixed/recurring expenses
│   │   │   │   ├── [id]/           # Single fixed expense operations
│   │   │   │   ├── overrides/      # Fixed expense overrides
│   │   │   │   └── route.ts        # All fixed expenses endpoint
│   │   │   ├── goals/              # Savings goals CRUD
│   │   │   │   ├── [id]/           # Single goal operations
│   │   │   │   └── route.ts        # All goals endpoint
│   │   │   └── income/             # Income management
│   │   │       ├── monthly/        # Monthly income & overrides
│   │   │       └── route.ts        # Base income endpoint
│   │   ├── sign-in/                # Sign-in page
│   │   ├── sign-up/                # Registration page
│   │   ├── monthly/                # Monthly tracking view
│   │   │   └── page.tsx
│   │   ├── page.tsx                # Yearly tracking (home page)
│   │   ├── layout.tsx              # Root layout with providers
│   │   └── globals.css             # Global styles
│   │
│   ├── components/                 # React components
│   │   ├── Dashboard.tsx           # Main dashboard container
│   │   ├── Header.tsx              # App header with auth & export
│   │   ├── Summary.tsx             # AI Financial Advisor (FinBot)
│   │   │
│   │   ├── Income & Budget Components
│   │   ├── IncomeInput.tsx         # Income input form
│   │   ├── MonthlyIncomeOverrideDialog.tsx  # Month-specific income
│   │   ├── BudgetProgressBar.tsx   # Visual budget progress
│   │   │
│   │   ├── Expense Components
│   │   ├── ExpenseForm.tsx         # Add/edit expense form
│   │   ├── ExpenseList.tsx         # List of expenses
│   │   ├── FixedExpensesManager.tsx # Recurring expenses manager
│   │   ├── MonthlyExpenseSection.tsx # Monthly expenses view
│   │   │
│   │   ├── Goals Components
│   │   ├── GoalsSection.tsx        # Goals container
│   │   ├── AddGoalDialog.tsx       # Create/edit goal dialog
│   │   ├── GoalCard.tsx            # Individual goal card
│   │   ├── ManageSavingsDialog.tsx # Add/withdraw contributions
│   │   ├── ContributionHistoryDialog.tsx # Transaction history
│   │   │
│   │   ├── Search & Navigation
│   │   ├── SearchAndFilterPanel.tsx # Advanced filtering
│   │   ├── SearchResultsDisplay.tsx # Filtered results
│   │   ├── MonthNavigationGrid.tsx  # Month selector grid
│   │   ├── YearSelector.tsx        # Year dropdown
│   │   │
│   │   ├── Data Visualization
│   │   ├── PieChartComponent.tsx   # Category pie charts
│   │   ├── LineChartComponent.tsx  # Trend line charts
│   │   ├── IncomeExpensePieChart.tsx # Income vs expense
│   │   │
│   │   ├── Utility Components
│   │   ├── ExportDataDialog.tsx    # Excel export dialog
│   │   ├── CoinLoadingAnimation.tsx # Loading states
│   │   ├── Providers.tsx           # Context providers
│   │   │
│   │   └── ui/                     # shadcn/ui primitives
│   │       ├── accordion.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── progress.tsx
│   │       ├── badge.tsx
│   │       ├── table.tsx
│   │       └── toaster.tsx
│   │
│   ├── lib/                        # Utilities and configurations
│   │   ├── models/                 # Mongoose schemas
│   │   │   ├── User.ts
│   │   │   ├── Expense.ts
│   │   │   ├── FixedExpense.ts
│   │   │   ├── FixedExpenseOverride.ts
│   │   │   ├── MonthlyIncomeOverride.ts
│   │   │   ├── Setting.ts
│   │   │   ├── Goal.ts
│   │   │   └── FilterPreset.ts
│   │   ├── auth.ts                 # NextAuth configuration
│   │   ├── auth.config.ts          # Auth config for middleware
│   │   ├── mongodb.ts              # MongoDB connection
│   │   ├── formatters.ts           # Currency & date formatters
│   │   ├── validation.ts           # Input validation utilities
│   │   ├── toast.ts                # Toast notification helpers
│   │   └── utils.ts                # General utilities
│   │
│   ├── types/                      # TypeScript definitions
│   │   └── next-auth.d.ts          # NextAuth type extensions
│   │
│   └── middleware.ts               # Auth middleware for protected routes
│
├── __tests__/                      # Test suite
│   ├── api/                        # API endpoint tests
│   │   ├── expenses.test.ts
│   │   ├── fixed-expenses.test.ts
│   │   ├── income.test.ts
│   │   └── monthly-income-overrides.test.ts
│   ├── components/                 # Component tests
│   │   ├── Dashboard.test.tsx
│   │   ├── ExpenseList.test.tsx
│   │   ├── IncomeInput.test.tsx
│   │   └── ... (more component tests)
│   ├── mocks/                      # Test mocks
│   │   ├── mongodb.ts
│   │   ├── next-auth.ts
│   │   ├── fetch.ts
│   │   └── next-router.ts
│   └── utils/
│       └── test-helpers.ts
│
├── public/                         # Static assets
│   └── *.svg                       # Icons and images
│
├── scripts/                        # Utility scripts
│   ├── seed-database.ts            # Database seeding
│   └── ... (migration scripts)
│
├── jest.config.js                  # Jest configuration
├── jest.setup.js                   # Jest setup file
├── next.config.ts                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.mjs              # PostCSS configuration
├── components.json                 # shadcn/ui configuration
└── package.json                    # Dependencies and scripts
```

##  Key Features in Detail

### 1. Authentication & Security

**Secure, Multi-Provider Authentication:**
- Email/password authentication with bcrypt password hashing
- Google OAuth for seamless social login
- JWT-based session management for stateless authentication
- Protected routes with middleware ensuring all financial data is private
- User-specific data isolation - each user only sees their own data

### 2. Fixed Expenses System

**Powerful Recurring Expense Management:**
- **Flexibility**: Choose which months each expense applies to (e.g., rent for all 12 months, insurance for quarterly months)
- **Override Capability**: Modify amount for specific months without affecting other months (e.g., increased rent in one month)
- **Visual Distinction**: Fixed expenses show with blue background and pin icon for easy identification
- **Batch Creation**: Create once, apply to multiple months automatically
- **Easy Management**: Collapsible manager UI for adding, editing, and deleting fixed expenses

### 3. Monthly Income Overrides

**Handle Irregular Income Effortlessly:**
- Set different income amounts for specific months
- Perfect for handling bonuses, seasonal income, or side income
- Clear visual indicators (green) for customized months
- Shows both base income (strikethrough) and override amount
- Optimistic UI updates for instant feedback
- Quick edit and delete actions

### 4. Savings Goals Management

**Track and Achieve Your Financial Goals:**
- **Goal Creation**: Set target amount and deadline for any savings goal
- **Automatic Calculations**: System calculates required monthly savings to meet deadline
- **Flexible Contributions**: Add money or withdraw from goals with transaction history
- **Transaction Types**: Distinguish between additions and withdrawals
- **Progress Tracking**: Visual progress bars showing completion percentage
- **Status Management**: Active, completed, or archived status for goals
- **Goal Cards**: Beautiful card-based UI with color-coded progress indicators
- **History View**: Complete transaction log with dates, amounts, and optional notes

### 5. Advanced Search & Filtering

**Find What You Need, Fast:**
- **Real-time Search**: Instant results as you type expense names
- **Multi-criteria Filtering**:
  - Date range (custom start and end dates)
  - Amount range (adjustable min/max sliders)
  - Name/description search
- **Filter Presets**: Save frequently used filter combinations
- **Preset Management**: Create, load, and delete custom presets
- **Active Indicators**: Visual feedback when filters are applied
- **Debounced Updates**: Smooth performance even with large datasets
- **Clear All**: One-click reset to remove all filters

### 6. Temporal Budget Awareness (AI)

**AI That Understands Time Context:**
- **Past Months**: Analyzes actual spending history
- **Current Month**: Tracks real-time progress and calculates remaining daily budget
- **Future Months**: Treats as planned expenses and forecasts available budget
- **Context-Aware Advice**: Different recommendations based on whether you're looking at past, present, or future
- **Spending Trends**: Identifies patterns across time periods

### 7. Data Visualization

**Multiple Chart Types for Better Insights:**
- **Pie Charts**: Category-wise expense distribution
- **Line Charts**: Trend analysis over time
- **Income vs Expense**: Comparative analysis charts
- **Progress Bars**: Budget consumption and goal progress
- **Color-Coded Indicators**: Green (surplus), Red (deficit), Blue (fixed)
- **Interactive**: Hover for detailed information
- **Responsive**: Adapts to different screen sizes

### 8. Month Navigation System

**Quick and Intuitive Navigation:**
- **Grid View**: Visual overview of all 12 months at a glance
- **Color Coding**: Green for surplus, red for deficit, neutral for balanced
- **Quick Stats**: See spent and remaining amounts directly in the grid
- **One-Click Access**: Jump to any month instantly
- **Current Month Highlight**: Clear indication of the current month
- **Year Selector**: Switch between different years

### 9. Excel Export System

**Professional Data Export:**
- **Multi-Year Selection**: Export one or multiple years at once
- **Organized Sheets**: Separate sheets for expenses, income, goals, and summaries
- **Professional Formatting**:
  - Currency symbols (₹) for all monetary values
  - Frozen header rows for easy scrolling
  - Color-coded headers and totals
  - Bold formatting for emphasis
  - Proper date formatting
- **Complete Data**: Includes all transactions, contributions, and metadata
- **Summary Statistics**: Automatic calculations and totals
- **Ready for Analysis**: Import into other tools or share with accountants

##  Data Privacy & Security

### Data Storage
- All financial data is stored securely in your MongoDB database
- **End-to-End Encryption**: All sensitive financial data (income, expenses, goals) is encrypted using AES-256-GCM before storage
- Each user's data is completely isolated with userId-based filtering
- Passwords are hashed using bcryptjs before storage (never stored in plain text)
- Session tokens are JWT-based for stateless authentication
- Even database administrators cannot read encrypted financial data without the encryption key

### Data Access
- User-specific data isolation - no cross-user data leakage
- Protected API routes with NextAuth middleware
- Only authenticated users can access their own data
- MongoDB indexes for efficient and secure querying

### Privacy
- **Military-Grade Encryption**: AES-256-GCM encryption for all financial amounts
- **Zero-Knowledge Architecture**: Your encryption key never leaves your server
- No third-party data sharing or analytics
- AI interactions process your data locally (sent to OpenAI API only)
- Self-hosted deployment option available for complete control
- No tracking or cookies beyond authentication requirements
- Encrypted data in MongoDB appears as indecipherable strings to anyone without your encryption key

### Data Portability
- Export all your data to Excel at any time
- Full ownership of your financial information
- Easy to migrate or backup your data

##  Database Models

The application uses MongoDB with Mongoose ODM. Here are the main data models:

### User Model
- Email, name, image (avatar)
- Password (hashed) or OAuth provider info
- Timestamps for account creation and updates

### Expense Model
- Name, amount, date, category
- Type: 'monthly' (one-time) or 'yearly' (recurring)
- Month and year association
- UserId for data isolation
- Indexed by userId, year, month, and date

### Fixed Expense Model
- Name, base amount
- Applicable months array (1-12)
- Override system for month-specific amounts
- UserId for data isolation
- Automatically creates expenses for selected months

### Fixed Expense Override Model
- Links to parent fixed expense
- Month-specific amount override
- Year association for multi-year support

### Goal Model
- Name, target amount, current amount, deadline
- Status: active, completed, archived
- Contributions array (additions/withdrawals with timestamps)
- Automatic monthly savings target calculation
- UserId for data isolation

### Monthly Income Override Model
- Custom income amount for specific month/year
- Overrides base monthly income
- UserId for data isolation

### Setting Model
- Yearly and monthly income values
- Year association
- UserId for data isolation

### Filter Preset Model
- Named filter combinations
- Search query, date range, amount range
- Year association
- UserId for data isolation

All models include:
- **Timestamps**: Automatic createdAt and updatedAt fields
- **User Isolation**: userId field with indexes for security and performance
- **Indexes**: Optimized queries for fast data retrieval

##  Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Roadmap & Future Features

Potential enhancements being considered:
- **Bill Reminders**: Notifications for upcoming recurring expenses
- **Receipt Scanning**: OCR-based receipt upload and expense extraction
- **Investment Tracking**: Integration with investment portfolios
- **Shared Budgets**: Collaborative budgets for families or roommates
- **Data Insights Dashboard**: Advanced analytics and spending reports
- **Automated Categorization**: ML-based automatic expense categorization
- **Bank Integration**: Connect bank accounts for automatic transaction import

##  Known Issues & Troubleshooting

### Common Issues

**MongoDB Connection Errors:**
- Ensure your MongoDB URI is correct in `.env.local`
- Check if MongoDB service is running (for local instances)
- Verify network access for MongoDB Atlas

**NextAuth Errors:**
- Verify `NEXTAUTH_SECRET` is set and is 32+ characters
- Ensure `NEXTAUTH_URL` matches your deployment URL
- For Google OAuth, check client ID and secret are correct

**Build Errors:**
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (18+ required)

##  Support & Contact

- **Issues**: Open an issue in the [GitHub repository](https://github.com/yourusername/budget_tracking_app/issues)
- **Discussions**: Join discussions for questions and feature requests
- **Email**: For private inquiries or security concerns
- **Documentation**: Check this README for comprehensive documentation

##  Acknowledgments

- **[Next.js](https://nextjs.org/)** - The React framework for production
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful and accessible UI components
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible UI primitives
- **[Recharts](https://recharts.org/)** - Composable charting library for React
- **[MongoDB](https://www.mongodb.com/)** - Developer data platform
- **[Mongoose](https://mongoosejs.com/)** - Elegant MongoDB object modeling
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication for Next.js
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide](https://lucide.dev/)** - Beautiful & consistent icon library
- **[ExcelJS](https://github.com/exceljs/exceljs)** - Excel workbook manager
- **[OpenAI](https://openai.com/)** - AI capabilities via GitHub Models

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

##  Show Your Support

If you find this project helpful, please consider giving it a star on GitHub! It helps others discover the project and motivates continued development.

---

**Built by Satwik Baramal using Next.js and TypeScript**

**Vivaranam** - *(Document in Sanskrit)*
