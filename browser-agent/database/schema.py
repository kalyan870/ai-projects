"""
Supabase Database Schema - Browser Agent

Run these SQL statements in Supabase SQL Editor:

-- Users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    goal TEXT NOT NULL,
    plan JSONB,
    status TEXT DEFAULT 'pending',
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    screenshots TEXT[]
);

-- Results table
CREATE TABLE results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    action TEXT NOT NULL,
    params JSONB,
    result TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Preferences table
CREATE TABLE preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) UNIQUE,
    preferred_domain TEXT,
    location TEXT,
    settings JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON users
    FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view own sessions" ON sessions
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own results" ON results
    FOR ALL USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));
"""

SQL_SCHEMA = __doc__
