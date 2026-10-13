# Diganta AI (দিগন্ত এআই) — Supabase Edge Function Deployment Guide

This Edge Function powers the **Diganta AI Gaming Assistant** inside **Diganta Arena** by securely calling the Groq API on the server side using the specified model (`llama-3.3-70b-versatile` or `llama-3.1-8b-instant`).

## Step 1: Obtain your Groq API Key
1. Go to [https://console.groq.com/keys](https://console.groq.com/keys)
2. Create or copy your API key from the Groq console.

## Step 2: Set the Secret in Supabase
Run the Supabase CLI command or set it via the Supabase Dashboard:

```bash
# Using Supabase CLI:
supabase secrets set GROQ_API_KEY="your_actual_groq_api_key_here"
```

*Or via Supabase Dashboard:*
1. Go to your **Supabase Project Dashboard** -> **Edge Functions** -> **Manage Secrets**.
2. Add a new secret named `GROQ_API_KEY` and paste your key.

## Step 3: Deploy the Edge Function
Deploy the function using the Supabase CLI:

```bash
supabase functions deploy diganta-ai --no-verify-jwt
```

*(Note: `--no-verify-jwt` allows public or authenticated frontend users to query the AI assistant safely, handled via CORS).*

## Step 4: Verification
Test the endpoint via curl or directly inside the Diganta Arena web UI:

```bash
curl -i --location --request POST 'https://<your-project-ref>.supabase.co/functions/v1/diganta-ai' \
  --header 'Content-Type: application/json' \
  --data '{"messages": [{"role": "user", "content": "কেমন আছো?"}]}'
```
