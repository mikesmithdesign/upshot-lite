# Upshot Lite : free one-page template for AI agent platforms

A single-page HTML template for an AI agent product aimed at technical founders and
operations teams: a hero with a live workflow diagram that draws and runs itself, a
pilots strip, a halftone band, a proof bento, pilot weeks, a pricing calculator, an FAQ
and a booking form. Smooth scrolling (Lenis), scroll-triggered reveals and a reduced
motion mode. Fonts are self-hosted, so it makes zero requests to Google. No build step,
no frameworks : open `index.html` and edit.

**Live demo:** https://upshot-lite.vercel.app

## Quick start

1. Edit the text directly in `index.html` : the product name, headline, pilot strip, proof figures, plans and FAQ.
2. Change the hero workflow in `site.js` (the `D` object near the top: nodes, steps and the trace line for each step). Node kinds are agent, system, person and decision.
3. Set the plan numbers (`BASE`, `INCLUDED`, `PER_RUN`) in `site.js` to match your pricing. The calculator follows them. The same prices are also written in the Team plan card and the FAQ in `index.html`, so change them there too.
4. Change colours in the first block of `style.css` : every colour is a token on `body`.
5. Wire the booking form to your own endpoint (it validates in the browser and shows a success message only).
6. Upload anywhere : it's static files. Vercel, Netlify and GitHub Pages host it free.

Add `?static` to the URL to see every animation in its finished state. The same happens
automatically for visitors who prefer reduced motion.

## License

Free for personal and commercial use, including unlimited client projects. If you are building a site with it, attribution is appreciated but not required.

Free template directories and galleries may host and redistribute this template at no charge, provided they credit Mike Smith Design, link to https://github.com/mikesmithdesign/upshot-lite, and keep this README and LICENSE.md with the download.

Not permitted: selling this template, charging for access to it, or including it in a paid product, template pack or subscription.

Full terms in LICENSE.md.

## Want more?

The full Upshot theme adds a seven-page site (Home, How it works, Pricing, Security, About,
Changelog, Book a pilot), a workflow diagram that reshapes itself between four patterns
(parallel fan-out, agent handoff, retry loop, edit loop), a scroll-driven story of one
run, an interactive sign-off rules panel, four colour packs with a Serif or Geist display
face. It is built in Astro, with the workflows, pricing, FAQs, team, security and
changelog in JSON data files.

[Upshot, the full Astro theme for AI agent platforms](https://mikesmithdesign.co.uk/themes/upshot) (£30)
