"use client";

import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import z from "zod";
import Loader from "./loader";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mail, Lock, User } from "lucide-react";
import { orpc } from "@/utils/orpc";

export default function SignUpForm({
  onSwitchToSignIn,
}: {
  onSwitchToSignIn: () => void;
}) {
  const router = useRouter();
  const { isPending } = authClient.useSession();

  // Check if this will be the first user (for UI display)
  const [isFirstUser, setIsFirstUser] = useState(false);

  // Check user count on component mount using oRPC
  const { data: userCountData } = useQuery(orpc.getUserCount.queryOptions());

  // Update isFirstUser when userCountData changes
  useEffect(() => {
    if (userCountData) {
      setIsFirstUser(userCountData.count === 0);
    }
  }, [userCountData]);

  // Mutation for assigning admin role
  const adminRoleMutation = useMutation(
    orpc.checkAndAssignAdminRole.mutationOptions({
      onSuccess: (data) => {
        if (data?.isAdmin) {
          toast.success(
            "Welcome! You've been automatically assigned admin privileges as the first user."
          );
        } else {
          toast.success("Sign up successful");
        }
        router.push("/dashboard");
      },
      onError: (error) => {
        console.error("Error assigning admin role:", error);
        toast.success("Sign up successful");
        router.push("/dashboard");
      },
    })
  );

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const signUpResult = await authClient.signUp.email(
          {
            email: value.email,
            password: value.password,
            name: value.name,
          },
          {
            onError: (error) => {
              toast.error(error.error.message || error.error.statusText);
            },
          }
        );

        // If signup was successful, check and assign admin role
        if (
          signUpResult &&
          typeof signUpResult === "object" &&
          signUpResult.data &&
          signUpResult.data.user
        ) {
          const user = signUpResult.data.user;

          if (user?.id) {
            adminRoleMutation.mutate({ userId: user.id });
            return; // Don't redirect here, let the mutation handle it
          }
        }

        // If no admin role assignment needed, redirect immediately
        router.push("/dashboard");
        toast.success("Sign up successful");
      } catch (error) {
        console.error("Signup error:", error);
      }
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/25 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/20),transparent_60%)] blur-3xl" />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]">
          <div className="size-full bg-[linear-gradient(to_right,theme(colors.border/40)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border/40)_1px,transparent_1px)] bg-[size:36px_36px]" />
        </div>
      </div>

      <div className="relative w-full max-w-md px-4">
        {/* Top badge for consistency */}
        <div className="mb-6 flex justify-center">
          <Badge className="backdrop-blur supports-[backdrop-filter]:bg-secondary/60">
            Create your account
          </Badge>
        </div>

        <Card className="relative overflow-hidden border-border/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
          </div>

          <CardHeader className="text-center">
            {/* Optional brand block to match landing */}
            {/* <div className="mb-2 flex items-center justify-center space-x-2">
              {siteConfig?.logo ? <siteConfig.logo className="size-6" /> : null}
              <span className="text-xl font-bold">{siteConfig?.name}</span>
            </div> */}
            <CardTitle className="text-2xl md:text-3xl">
              Create Account
            </CardTitle>
            <p className="mt-2 text-muted-foreground">
              Start your journey with us today
            </p>

            {/* First user notification */}
            {isFirstUser && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/40 mt-0.5">
                    <div className="size-2 rounded-full bg-blue-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      🎉 You're the first user!
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      You'll automatically be assigned admin privileges and have
                      full access to manage the platform.
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-1 font-medium">
                        Total Users: 0
                      </span>
                      <span>→</span>
                      <span className="inline-flex items-center rounded-full bg-blue-200 dark:bg-blue-800 px-2 py-1 font-medium">
                        You'll be #1
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            <Separator className="mb-6" />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-5"
            >
              <div>
                <form.Field name="name">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Name</Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="pl-9"
                          placeholder="Jane Doe"
                          autoComplete="name"
                          aria-label="Full name"
                          required
                        />
                      </div>
                      {field.state.meta.errors.map((error) => (
                        <p
                          key={error?.message}
                          className="text-sm text-red-500"
                        >
                          {error?.message}
                        </p>
                      ))}
                    </div>
                  )}
                </form.Field>
              </div>

              <div>
                <form.Field name="email">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Email</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="pl-9"
                          placeholder="you@example.com"
                          autoComplete="email"
                          aria-label="Email address"
                          required
                        />
                      </div>
                      {field.state.meta.errors.map((error) => (
                        <p
                          key={error?.message}
                          className="text-sm text-red-500"
                        >
                          {error?.message}
                        </p>
                      ))}
                    </div>
                  )}
                </form.Field>
              </div>

              <div>
                <form.Field name="password">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Password</Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="pl-9"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          aria-label="Password"
                          required
                        />
                      </div>
                      {field.state.meta.errors.map((error) => (
                        <p
                          key={error?.message}
                          className="text-sm text-red-500"
                        >
                          {error?.message}
                        </p>
                      ))}
                    </div>
                  )}
                </form.Field>
              </div>

              <form.Subscribe>
                {(state) => (
                  <Button
                    type="submit"
                    className="w-full px-8 text-base shadow-sm transition-all duration-300 hover:shadow-md"
                    disabled={
                      !state.canSubmit ||
                      state.isSubmitting ||
                      adminRoleMutation.isPending
                    }
                  >
                    {state.isSubmitting || adminRoleMutation.isPending
                      ? "Creating..."
                      : "Sign Up"}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                )}
              </form.Subscribe>
            </form>

            {/* Helper links */}
            <div className="mt-6 flex flex-wrap justify-between text-sm text-muted-foreground">
              <Link
                href="/privacy"
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                Privacy
              </Link>
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-indigo-600 underline-offset-4 hover:text-indigo-800 hover:underline"
              >
                Already have an account? Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
