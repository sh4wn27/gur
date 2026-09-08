# Growing Up with Robotics

The website and digital properties for **Growing Up with Robotics (GUR)** — a student-led 501(c)(3) nonprofit making robotics and STEM education accessible to K–12 students through mentorship, team-to-team coaching, free courses, and camps.

🔗 Live site: [growingupwithrobotics.org](https://growingupwithrobotics.org)

## Current site: `signal/`

`signal/` is the active, production website ("GUR Signal") deployed via Vercel. It's a single-page app built with:

- **React 18** (UMD build) + **Babel Standalone**, loaded directly in `index.html` — no build step or bundler
- Plain CSS (custom properties for theming, light/dark mode support)
- Google Fonts (Bricolage Grotesque, JetBrains Mono, DM Sans)

Key sections of the site:

- **Home** — mission, impact stats, program overview
- **About** — org story, leadership and member roster
- **Programs** — mentorship, team-to-team support, courses, camps & workshops
- **Insights** — photo/video gallery of program moments
- **Get Involved** — application paths for students, mentors, schools, and sponsors
- **Sponsors** — supporting organizations

### Running locally

```bash
cd signal
python3 -m http.server 8080
# open http://localhost:8080
```

No install or build step is required — the page loads React/Babel from CDN and transpiles JSX in-browser.

### Deployment

The site deploys to Vercel from the `signal/` directory (see `signal/vercel.json`). Pushes to `main` trigger automatic deployments.

## Other directories

The repository also contains earlier/legacy versions of the site (`about/`, `assets/`, `contact/`, `insights/`, `projects/`, `gur-deploy/`, `website/`) kept for reference. **`signal/`** is the one actively maintained and deployed.

## Contributing

Issues and pull requests are welcome at [github.com/sh4wn27/gur](https://github.com/sh4wn27/gur).

## License

© 2023–2026 Growing Up with Robotics. All rights reserved.
