import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qkbstsilkczvzgxmhsnw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Wjp8Hq97ZcCylRtEbInDMA_9hJKfeIT'

export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
