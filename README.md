# M87 Planner

A modern, AI-powered task planning and scheduling application built with React, TypeScript, and Supabase.

## Features

- 🎯 **Smart Task Management**: Create, organize, and track tasks with priorities and deadlines
- 📅 **Intelligent Scheduling**: AI-powered auto-planning to optimize your day
- 🔄 **Routines**: Set up recurring tasks and habits
- 📊 **Progress Tracking**: Monitor your productivity with detailed analytics
- 🌙 **Dark Mode**: Beautiful, premium UI with dark theme support
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **State Management**: TanStack Query
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/cyberspector15-del/m87planner.git
   cd m87planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Run the migrations from the `supabase/migrations` folder in your Supabase project

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials:
     ```env
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:8080`

## Building for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── integrations/   # Supabase client and types
│   ├── pages/          # Page components
│   ├── services/       # Business logic and API calls
│   └── types/          # TypeScript type definitions
├── supabase/
│   ├── functions/      # Edge functions
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

## License

MIT
