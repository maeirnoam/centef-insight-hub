import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hbltirfzbkktxjktkpas.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibHRpcmZ6YmtrdHhqa3RrcGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNTUyMjksImV4cCI6MjA2NTkzMTIyOX0.yvh3XxdIIc96hSl0DzzaGKt_k0ndQ-SkGxmJCI26KqM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
