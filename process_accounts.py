#!/usr/bin/env python3

"""
Process db_migration.sql to create a proper import_accounts.sql file
that can be used to import accounts with proper structure
"""

import re
import os

INPUT_FILE = "/Users/fstrauf/Downloads/db_migration.sql"
OUTPUT_FILE = "import_accounts.sql"

def extract_accounts():
    """Extract account data from the SQL file"""
    
    accounts = []
    with open(INPUT_FILE, 'r') as f:
        content = f.read()
    
    # Extract all values from the INSERT statement
    pattern = r"\((.*?)\)"
    matches = re.findall(pattern, content)
    
    # Skip the first match which is the column names
    for i, values in enumerate(matches):
        # Skip the header row (first match)
        if i == 0:
            continue
            
        # Split by comma while respecting quotes and brackets
        items = []
        current = ""
        inside_quotes = False
        inside_brackets = 0
        
        for char in values + ',':  # Add comma at the end to process the last value
            if char == "'" and not inside_brackets:
                inside_quotes = not inside_quotes
                current += char
            elif char == '[':
                inside_brackets += 1
                current += char
            elif char == ']':
                inside_brackets -= 1
                current += char
            elif char == ',' and not inside_quotes and inside_brackets == 0:
                items.append(current.strip())
                current = ""
            else:
                current += char
        
        accounts.append(items)
    
    return accounts

def generate_sql(accounts):
    """Generate SQL import script"""
    
    sql_header = """-- Script to import accounts from old database, linking them with existing users by email
BEGIN;

-- Create a temporary table to hold the old account data
CREATE TEMP TABLE temp_accounts (
  categorisationRange TEXT,
  categorisationTab TEXT,
  columnOrderCategorisation JSONB,
  api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  email TEXT,
  lastUsed TIMESTAMP WITH TIME ZONE,
  requestsCount INTEGER,
  appBetaOptIn TEXT
);

-- Insert data from the old account table
INSERT INTO temp_accounts VALUES
"""
    
    # Process each account into a SQL value
    sql_values = []
    for acc in accounts:
        if len(acc) != 9:  # Skip if not the right number of columns
            continue
            
        # Deduplicate based on email - keep the first occurrence
        email = acc[5].strip("'")
        if any(email == v[5].strip("'") for v in sql_values):
            continue
            
        # Make sure requestsCount is treated as integer
        if acc[7] == 'NULL':
            acc[7] = '0'
            
        sql_values.append(acc)
    
    # Join values with commas
    values_str = ",\n".join([f"({', '.join(v)})" for v in sql_values])
    
    sql_footer = """;

-- Now insert into the accounts table with user IDs from the users table
INSERT INTO accounts (
  id, 
  userId, 
  type, 
  provider,
  providerAccountId,
  refresh_token,
  access_token,
  expires_at,
  token_type,
  scope,
  id_token,
  session_state,
  categorisationRange,
  categorisationTab,
  columnOrderCategorisation,
  api_key,
  created_at,
  lastUsed,
  requestsCount,
  appBetaOptIn
)
SELECT 
  gen_random_uuid(), -- Generate a new UUID for the id
  u.id, -- Get userId from users table
  'email', -- Default type
  'credentials', -- Default provider
  ta.email, -- Using email as providerAccountId
  NULL, -- refresh_token
  NULL, -- access_token
  NULL, -- expires_at
  NULL, -- token_type
  NULL, -- scope
  NULL, -- id_token
  NULL, -- session_state
  ta.categorisationRange,
  ta.categorisationTab,
  ta.columnOrderCategorisation,
  ta.api_key,
  ta.created_at,
  ta.lastUsed,
  ta.requestsCount,
  CASE WHEN ta.appBetaOptIn IS NULL THEN NULL ELSE ta.appBetaOptIn::appBetaOptInStatus END
FROM temp_accounts ta
JOIN users u ON u.email = ta.email
ON CONFLICT DO NOTHING; -- Skip if there's already an account for this user

-- Drop the temporary table
DROP TABLE temp_accounts;

COMMIT;"""
    
    return sql_header + values_str + sql_footer

def main():
    accounts = extract_accounts()
    sql = generate_sql(accounts)
    
    with open(OUTPUT_FILE, 'w') as f:
        f.write(sql)
    
    print(f"Generated {OUTPUT_FILE} with {len(accounts)} accounts")

if __name__ == "__main__":
    main() 