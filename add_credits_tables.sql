-- Create user_credits table
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create credit_transactions table
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for additions, negative for deductions
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'redemption', 'refund', 'bonus')),
  description TEXT,
  kit_id UUID REFERENCES hydration_kits(id), -- Optional, for redemption transactions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for user_credits
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own credits
CREATE POLICY "Users can view their own credits"
  ON user_credits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for system to manage credits
CREATE POLICY "System can manage all credits"
  ON user_credits
  USING (auth.role() = 'service_role');

-- Add RLS policies for credit_transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own transactions
CREATE POLICY "Users can view their own transactions"
  ON credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for system to manage transactions
CREATE POLICY "System can manage all transactions"
  ON credit_transactions
  USING (auth.role() = 'service_role');
