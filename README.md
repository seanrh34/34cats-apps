# 34cats Apps

A modern Next.js application showcasing innovative tools and AI-powered creations.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase
- **Deployment**: Vercel

## 📦 Project Structure

```
34cats-apps/
├── app/                # Next.js App Router pages
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   ├── home/          # Home page components
│   ├── layout/        # Layout components
│   └── shared/        # Shared components
├── lib/               # Utilities and configurations
│   ├── types/         # TypeScript types
│   ├── supabase/      # Supabase clients
│   └── utils.ts       # Helper functions
├── hooks/             # Custom React hooks
├── config/            # App configuration
└── public/            # Static assets
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (optional, for authentication features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/34cats/34cats-apps.git
cd 34cats-apps
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Key Features

- **Modular Architecture**: Clean separation of concerns with organized folder structure
- **Reusable Components**: UI component library (Button, Card, Input, etc.)
- **Type Safety**: Full TypeScript support with shared type definitions
- **Path Aliases**: Clean imports using `@/` prefix
- **Supabase Integration**: Ready-to-use authentication and database setup
- **Responsive Design**: Mobile-first responsive layouts
- **Modern Stack**: Next.js 16 with App Router and React Server Components

## 📚 Documentation

- [Architecture Guide](./ARCHITECTURE.md) - Detailed project architecture
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🚢 Deployment

### Deploy on Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (if using server-side operations)

## 📄 License

This project is private and proprietary to 34cats.

## 🤝 Contributing

This is a private project. Contact the team for collaboration opportunities.

---

Built with ❤️ by 34cats
