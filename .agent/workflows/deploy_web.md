---
description: Deploy Web Application to Vercel
---

# Deploy to Vercel

1.  **Create Vercel Account**: Go to [vercel.com](https://vercel.com) and sign up/login.
2.  **Install Vercel CLI** (Optional but recommended):
    ```bash
    npm i -g vercel
    ```
3.  **Deploy**:
    Run the following command in your terminal:
    ```bash
    npx vercel
    ```
    - Follow the prompts.
    - Set up your project.
    - It will automatically detect Next.js.
4.  **Environment Variables**:
    - Go to your project settings in Vercel Dashboard.
    - Add the following environment variables (copy from `.env.local`):
        - `NEXT_PUBLIC_SUPABASE_URL`
        - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        - `STRIPE_SECRET_KEY`
        - `STRIPE_WEBHOOK_SECRET`
        - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
        - `NEXT_PUBLIC_BASE_URL` (Your production URL)
5.  **Production Deployment**:
    ```bash
    npx vercel --prod
    ```
