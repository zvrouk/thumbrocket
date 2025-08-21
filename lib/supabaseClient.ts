import { createClient } from '@supabase/supabase-js'

// TEMPORARY HARDCODED VALUES - REPLACE WITH YOUR ACTUAL CREDENTIALS
const supabaseUrl = 'https://jevxrhtmuefoarfggbsn.supabase.co' // ← REPLACE THIS
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldnhyaHRtdWVmb2FyZmdnYnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDg2MjQsImV4cCI6MjA3MTE4NDYyNH0.r1AQ83WGEe0T8Zx5hlGTqKn8bHC9wV5VWQqY5UD09no' // ← REPLACE THIS

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Add debug log
console.log('Supabase client initialized:', !!supabase)