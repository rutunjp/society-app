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

2. **Google Sheets Configuration**
   - Create a Google Spreadsheet.
   - You must create the following exact 4 tabs (case-sensitive) within it: `Members`, `Payments`, `Events`, `Expenses`.
   - Setup a [Google Cloud Service Account](https://cloud.google.com/iam/docs/service-accounts-create) and extract its JSON keys.
   - **Crucial**: Share your new Google Sheet with the Service Account email (e.g., `account@project.iam.gserviceaccount.com`) as an **Editor**.

3. **Google OAuth Configuration**
   - Under your Google Cloud Console, navigate to **APIs & Services > Credentials > Create OAuth Client ID** (Web Application).
   - Set the authorized redirect URI to: `http://localhost:3000/api/auth/callback/google` (and add your production URL when deployed).

4. **Environment Variables**
   Create a `.env.local` file in the root directory and inject your keys into this structure:

   ```env
   # Google Sheets ID (Found in the URL of your spreadsheet)
   SHEET_ID="your_google_sheet_id_here"
   
   # Google Service Account JSON stringified representation
   GOOGLE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"... (Insert Full JSON content here)'
   
   # Auth Settings
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="a-random-secure-string" # Run `openssl rand -base64 32` to generate
   
   # Google Client Auth Strings
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## 📄 License

MIT License. Designed & engineered for internal society committee administration.
