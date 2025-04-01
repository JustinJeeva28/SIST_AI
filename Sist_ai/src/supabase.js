import supabase from "./supabaseClient.js";

const setupDatabase = async () => {
  try {
    // Step 1: Create Table
    const { data: createTable, error: createError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id BIGSERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          session_id TEXT UNIQUE NOT NULL,
          title TEXT,
          messages JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createError) throw createError;
    console.log("✅ Table Created:", createTable);

    // Step 2: Create Index
    const { error: indexError } = await supabase.rpc('sql', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
      `
    });

    if (indexError) throw indexError;
    console.log("✅ Index Created");

    // Step 3: Enable Row Level Security
    const { error: rlsError } = await supabase.rpc('sql', {
      query: `ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;`
    });

    if (rlsError) throw rlsError;
    console.log("✅ Row Level Security Enabled");

    // Step 4: Create Policies
    const policies = [
      `CREATE POLICY select_own_chats ON chat_sessions FOR SELECT USING (auth.uid()::text = user_id);`,
      `CREATE POLICY insert_own_chats ON chat_sessions FOR INSERT WITH CHECK (auth.uid()::text = user_id);`,
      `CREATE POLICY update_own_chats ON chat_sessions FOR UPDATE USING (auth.uid()::text = user_id);`,
      `CREATE POLICY delete_own_chats ON chat_sessions FOR DELETE USING (auth.uid()::text = user_id);`
    ];

    for (const query of policies) {
      const { error: policyError } = await supabase.rpc('sql', { query });
      if (policyError) throw policyError;
      console.log(`✅ Policy Applied: ${query}`);
    }

    console.log("🎉 Database setup completed successfully!");
  } catch (error) {
    console.error("❌ Error setting up database:", error);
  }
};

setupDatabase();
