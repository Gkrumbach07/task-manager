# Task Manager

A modern task management application built with Next.js, Shadcn UI, and Clerk Authentication.

## Technologies Used

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Shadcn UI
- Clerk Authentication

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your Clerk account and get your API keys from [Clerk Dashboard](https://dashboard.clerk.dev)

4. Create a `.env.local` file in the root directory and add your Clerk environment variables:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
   CLERK_SECRET_KEY=your_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- User authentication with Clerk
- Modern UI with Shadcn components
- Fully typed with TypeScript
- Responsive design with Tailwind CSS

## Project Structure

- `app/` - Next.js app router pages and layouts
- `components/` - Reusable UI components
- `lib/` - Utility functions and shared logic
- `public/` - Static assets

## License

MIT
