# React / Tailwind conventions

These are the conventions Claude should follow when generating prototype code. They get injected into the system prompt at `{{REACT_TEMPLATE_CONVENTIONS}}`.

## File structure

- Each component file starts with a one-line header comment naming the component and what it does (e.g. `// PropertyCard — single property tile shown in browse and search results`).
- Pages live in `src/pages/`. Shared components live in `src/components/`. Mock data lives in `src/data/mockData.ts` and is imported by name.

## Imports

Order imports as:

1. React (`react`, `react-dom`)
2. `react-router-dom`
3. Third-party libraries (`@faker-js/faker`, `lucide-react`, `clsx`, `tailwind-merge`)
4. Local components (`../components/...`)
5. Types

A blank line separates each group.

## Components

- Functional components only. No class components. No `React.FC`.
- **Default-export each page.** **Named-export shared components.**
- Hooks at the top of the function body. No conditional hook calls.

## Layout

- Every page has a `<main>` wrapper with consistent padding: `px-4 py-6 sm:px-6 lg:px-8`.
- Mobile-first. Design at 375px first; add `sm:` and `lg:` breakpoints as needed.
- Headings: `<h1>` once per page; `<h2>` for major sections.

## Accessibility

- Every clickable element has a visible focus ring. Use Tailwind's `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`.
- Buttons that are icon-only need an `aria-label`.

## Forms

- For prototypes, prevent default and update local state. Never submit to a backend.
- Show inline validation on blur, not on every keystroke.

## Navigation

- Use `<Link>` from `react-router-dom` for in-app navigation.
- Use `useNavigate()` for programmatic navigation (e.g., after a fake form submit).
- **Never use `window.location`** — it breaks the SPA history and confuses the back button on mobile.

## Styling

- Tailwind utilities only. No inline styles. No custom CSS beyond `@tailwind base; @tailwind components; @tailwind utilities;` in `src/index.css`.
- Conditional classes go through `clsx` (and `tailwind-merge` when merging arbitrary class strings).

## Mock data

- All data lives in `src/data/mockData.ts`. Pages import named exports.
- Use `@faker-js/faker` for randomized fields, but **seed it once** at module load so the data is stable across reloads (otherwise PMs see different content every refresh and lose trust in the prototype).

---

Edit this file as you learn what produces better prototypes. Each change is a hypothesis about prompt design — note in your run logs whether it improved output quality.
