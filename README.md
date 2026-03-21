<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c7dbf09c-3557-46fb-9160-b0ebbd2d3f56

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Recommended project structure

Suggested `src/` layout to keep the project organized as it grows:

```
src/
   assets/        # images, sounds, fonts
   components/    # reusable UI components (export from index.ts)
   pages/         # page-level components or routes
   hooks/         # custom React hooks
   utils/         # pure helper functions
   styles/        # global and component styles
   types/         # shared TypeScript types
   constants/     # app-wide constants
   App.tsx
   main.tsx
```

I added starter folders with small READMEs and example files under `src/` to help you split `App.tsx` into smaller components when you're ready.
