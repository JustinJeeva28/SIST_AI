import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iijldxaizmgjbuhdugxd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpamxkeGFpem1namJ1aGR1Z3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNDk5MjMsImV4cCI6MjA1NjkyNTkyM30.hKgc2PVdVIcJC9lygiQkT7xpPnEoaNRPl_a5XucBiZA'
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase;