# Budget Tracking Application

> A comprehensive personal finance management system with AI-powered insights and intelligent budget forecasting

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🎯 Overview

A powerful, modern budget tracking application that helps you take control of your finances through intelligent tracking, AI-powered insights, and predictive forecasting. Built with Next.js and TypeScript, featuring a sophisticated dual-tracking system and an AI financial advisor.

## ✨ Key Features

### 📊 Dual Tracking System
- **Yearly Tracking**: Set yearly income with automatic monthly conversion and track recurring annual expenses
- **Monthly Tracking**: Independent monthly income management with granular expense tracking for each month (Jan-Dec)

### 💰 Smart Expense Management
- **One-Time Expenses**: Add, edit, and delete expenses for specific months
- **Fixed/Recurring Expenses**: Create expenses that automatically apply to selected months
- **Override System**: Modify fixed expense amounts for specific months without affecting other months
- **Category Recognition**: Intelligent expense categorization for better insights

### 🤖 AI Financial Advisor (FinBot)
- **Temporal Awareness**: Distinguishes between past spending, current progress, and future plans
- **Personalized Insights**: Analyzes spending patterns and identifies trends
- **Budget Recommendations**: Applies 50/30/20 rule and industry-standard spending percentages
- **Predictive Forecasting**: Calculates available budget and suggests optimal allocation
- **Goal Planning**: Helps set and achieve financial objectives with actionable steps

### 📈 Advanced Analytics
- **Real-time Calculations**: Instant updates to all financial metrics
- **Month-over-Month Analysis**: Track spending trends across months
- **Budget Health Indicators**: Visual feedback on surplus/deficit status
- **Progress Tracking**: Daily budget monitoring for current month
- **Future Projections**: View available budget for upcoming months

### 🎨 Modern User Interface
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile
- **Interactive Charts**: Visual expense distribution with pie charts
- **Month Navigation Grid**: Quick access to any month with color-coded status
- **Two View Modes**: 
  - Current Month Focus: Detailed view with prominent display
  - All Months Accordion: Comprehensive overview of entire year
- **Clean & Intuitive**: Built with shadcn/ui components and Tailwind CSS

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.5 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.0
- **UI Components**: shadcn/ui (Radix UI)
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Hooks

### Backend
- **Runtime**: Node.js
- **Database**: MongoDB with Mongoose ODM
- **API**: Next.js API Routes (serverless)
- **AI Integration**: OpenAI API (GitHub Models)

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB instance (local or cloud)
- Google account for OAuth setup (free, optional for Google sign-in)
- GitHub Token for AI features (optional)

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

## 📖 Usage Guide

### Setting Up Your Budget

1. **Choose Your Tracking Mode**
   - Use **Yearly Tracking** for high-level annual planning
   - Use **Monthly Tracking** for detailed month-by-month management

2. **Set Your Income**
   - Enter yearly income (auto-converts to monthly) or set monthly income directly
   - Update anytime as your income changes

3. **Add Your Expenses**
   - **For recurring expenses**: Use Fixed Expenses Manager to create expenses that auto-apply to selected months
   - **For one-time expenses**: Add directly to specific months
   - Edit or delete expenses as needed

4. **Monitor Your Budget**
   - View real-time calculations of spending vs. income
   - Check budget health for each month
   - Use month navigation grid to quickly jump between months

5. **Get AI Insights**
   - Ask FinBot questions about your spending
   - Request budget recommendations
   - Get forecasts for future months
   - Receive personalized financial advice

### Example Queries for FinBot

- "How much money do I have left for November?"
- "Which months did I overspend and why?"
- "Where should I allocate my remaining budget?"
- "What's my average monthly spending on food?"
- "Help me create a savings plan for ₹50,000"
- "Analyze my spending trends over the past 6 months"

## 📁 Project Structure

```
budget_tracking_app/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── expenses/           # Expense endpoints
│   │   │   ├── fixed-expenses/     # Fixed expense endpoints
│   │   │   └── income/             # Income endpoints
│   │   ├── monthly/                # Monthly tracking page
│   │   ├── page.tsx                # Yearly tracking page
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── Dashboard.tsx           # Main dashboard
│   │   ├── FixedExpensesManager.tsx
│   │   ├── MonthlyExpenseSection.tsx
│   │   ├── Summary.tsx             # AI chatbot component
│   │   └── ui/                     # shadcn/ui components
│   └── lib/
│       ├── models/                 # MongoDB schemas
│       ├── mongodb.ts              # Database connection
│       └── formatters.ts           # Utility functions
├── public/                         # Static assets
└── package.json
```

## 🎯 Key Features in Detail

### Fixed Expenses System

Create recurring expenses that automatically appear in selected months:

- **Flexibility**: Choose which months each expense applies to (e.g., rent for all 12 months, insurance for quarterly months)
- **Override Capability**: Modify amount for specific months (e.g., increased rent in one month)
- **Visual Distinction**: Fixed expenses show with blue background and pin icon
- **Easy Management**: Collapsible manager for adding, editing, and deleting fixed expenses

### Temporal Budget Awareness

The AI understands time context:

- **Past Months**: Analyzes actual spending (what you've already spent)
- **Current Month**: Tracks progress and calculates remaining daily budget
- **Future Months**: Treats as planned expenses and forecasts available budget

### Month Navigation

Quick and intuitive navigation:

- **Grid View**: Visual overview of all 12 months
- **Color Coding**: Green for surplus, red for deficit
- **Quick Stats**: See spent and remaining amounts at a glance
- **One-Click Access**: Jump to any month instantly

## 🔒 Data Privacy

- All financial data is stored securely in your MongoDB database
- No third-party data sharing
- AI interactions use anonymized data patterns
- Self-hosted deployment option available

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Recharts](https://recharts.org/) - Composable charting library
- [MongoDB](https://www.mongodb.com/) - Database platform
- [Lucide](https://lucide.dev/) - Icon library

## 📧 Support

For support, email your-email@example.com or open an issue in the repository.

---

**Built with ❤️ using Next.js and TypeScript**
