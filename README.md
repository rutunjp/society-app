# SocietyApp 🏢

A full-stack Housing Society Management Dashboard built with **Next.js 14 (App Router)** and **Tailwind CSS**, using **Google Sheets** as a lightweight, scalable, and readily accessible database backend.

## 🚀 Features

- **Google OAuth Authentication**: Secure login restricted to verified Google accounts via NextAuth.
- **Google Sheets Database**: Zero-configuration, free, and highly visible database implementation. Read and write directly to Google Spreadsheets.
- **Members Directory**: Tracks owners and tenants. Includes a **Bulk CSV Upload** tool for rapid society onboarding.
- **Payments & Receipts**: Tracks maintenance and event funds. Features dynamic **1-Click WhatsApp JPEG Receipt** generation utilizing `html2canvas`.
- **Event & Expense Tracking**: Maintains records of outgoing society funds and festival ledgers.
- **Mobile First & Responsive**: Designed iteratively from a "Mobile-First" point of view. Features an app-like bottom navigation tab bar and scrollable table overflow on small device widths.

## 💻 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Database Connector**: [Google APIs (googleapis)](https://www.npmjs.com/package/googleapis)
- **Utilities**: `papaparse` (CSV processing), `html2canvas` (JPEG receipt generation), `react-hot-toast` (Snackbars).

## 🛠 Required Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rutunjp/society-app.git
   cd society-app
   npm install
   ```

2. **Supabase Database & Auth Configuration**
   - Create a [Supabase](https://supabase.com/) project.
   - Run the SQL script located at `supabase/schema.sql` in your Supabase SQL Editor to set up tables, Row Level Security (RLS) policies, and triggers.
   - Set up Google Auth in Supabase under **Authentication > Providers > Google**. Follow the Supabase instructions to obtain Client ID and Secret from Google Cloud Console and set the authorized redirect URI.

3. **Environment Variables**
   Create a `.env.local` file in the root directory and inject your keys into this structure:

   ```env
   # Supabase Keys (Found in Project Settings > API)
   NEXT_PUBLIC_SUPABASE_URL="your-project-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## 📄 License

MIT License. Designed & engineered for internal society committee administration.
