import type React from "react";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { resetPasswordAction } from "@/lib/actions/auth";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-2">
            <ClipboardList className="h-6 w-6" />
            <span className="font-bold text-xl">TaskFlow</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          Reset your password
        </CardTitle>
        <CardDescription className="text-center">
          Please enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormMessage message={searchParams} />
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new password">New password</Label>
            <Input
              id="new password"
              type="password"
              placeholder="********"
              name="password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm password">Confirm password</Label>
            <Input
              id="confirm password"
              type="password"
              placeholder="********"
              name="confirmPassword"
              required
            />
          </div>
          <SubmitButton formAction={resetPasswordAction}>
            Reset Password
          </SubmitButton>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-center text-sm">
          Remember your password?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
