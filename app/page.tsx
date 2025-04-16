import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4">
          Welcome to Task Manager
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center lg:static lg:h-auto lg:w-auto">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold">Task Manager</h1>
        <p className="text-center text-gray-600">
          A modern task management application built with Next.js and Shadcn UI
        </p>
        <Button>Get Started</Button>
      </div>
    </main>
  );
}
