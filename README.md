<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run your Next.js DSA Buddy app

This project now runs on Next.js with the App Router.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set any needed API keys in [.env.local](.env.local)
3. Start the app:
   `npm run dev`
4. Open:
   `http://localhost:3005`

## Notes

- The old Express MCP proxy has been moved into Next API routes at `/api/mcp` and `/api/mcp/health`.
- Build for production with `npm run build`, then run it with `npm run start`.
