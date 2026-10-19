# smol stuuf

load this

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://smolstuuff.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5af9fcfe-9ab6-4f4e-bf74-1def16308975).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```


## Working from GitHub

Start with [Project context](docs/PROJECT_CONTEXT.md), [Database restoration](docs/DATABASE.md), the [schema-only snapshot](drizzle/schema.snapshot.sql), [environment placeholders](.env.example), and [asset inventory](docs/ASSETS.md). Hosted data, secrets and image bytes are not automatically included in a clone.

- Never force-push or rewrite published history (including rebasing, amending or squashing already-pushed commits).
- Keep the connected branch buildable; pushed commits on that branch sync back to Lovable.
- Generate future DB migrations through the Lovable migration tool; external tools can prepare SQL for that workflow. Git sync does not apply migrations. Do not edit drizzle/schema.ts or generated migration metadata.
