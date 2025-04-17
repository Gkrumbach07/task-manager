"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { supabaseClient } from "@/lib/supabase/client"
import type { Session, User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any; data: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Use a ref to track if we've already initialized
  const isInitialized = useRef(false)
  // Use a ref to store the subscription to prevent recreating it
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  useEffect(() => {
    // Only run this once
    if (isInitialized.current) return
    isInitialized.current = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true)

        const {
          data: { session },
        } = await supabaseClient.auth.getSession()

        if (session) {
          setSession(session)
          setUser(session.user)
        }
      } catch (error) {
        console.error("Error getting session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Set up auth state change listener only once
    if (!subscriptionRef.current) {
      const {
        data: { subscription },
      } = supabaseClient.auth.onAuthStateChange((event, session) => {
        // Only log and update state for meaningful events
        if (event !== "INITIAL_SESSION") {
          console.log("Auth state changed:", event, session?.user?.email)
        }

        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })

      subscriptionRef.current = subscription
    }

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, []) // Empty dependency array ensures this only runs once

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        return { error }
      }

      return { error: null }
    } catch (err) {
      console.error("Unexpected sign in error:", err)
      return { error: err }
    }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signUp({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    await supabaseClient.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
