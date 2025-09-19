### Project Overview

This is a budget tracking application built with Next.js and TypeScript. It allows users to manage their yearly income and expenses. The application has a clean and modern UI built with Tailwind CSS and shadcn/ui.

### Key Features

*   **Income Management:** Users can set and update their yearly income.
*   **Expense Tracking:** Users can add, view, and delete expenses.
*   **Dashboard:** A dashboard provides a summary of the user's financial situation, including monthly income, total expenses, and the remaining balance.
*   **Data Visualization:** A pie chart visualizes the distribution of expenses.
*   **Data Persistence:** The application uses a SQLite database to store income and expense data.

### Technical Details

*   **Framework:** Next.js
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui
*   **Database:** SQLite
*   **API:** Next.js API Routes

### File Structure

*   `src/app/page.tsx`: The main entry point of the application.
*   `src/app/api/`: Contains the API routes for handling income and expenses.
*   `src/components/`: Contains the React components used to build the UI.
*   `src/lib/db.ts`: Contains the database initialization and access logic.
*   `budget.db`: The SQLite database file.
