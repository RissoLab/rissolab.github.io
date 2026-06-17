# RissoLab WebPage

Template: https://github.com/theodorusclarence/ts-nextjs-tailwind-starter

## Preview / Development

Install Node.js/npm:

macOS:
```bash
brew install node
```

Linux:
```bash
sudo apt install nodejs npm
```

Then run:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Editing content

Most page content is written in Markdown files inside `src/content`.

- Homepage: `src/content/homepage/_index.md`
- Research: `src/content/research/_index.md`
- People: `src/content/people/*.md`
- News & Events: `src/content/news-events/*.md`
- Contact: `src/content/contact/_index.md`


### Add a news item

Create a new Markdown file in `src/content/news-events`, for example:

```text
src/content/news-events/my-news-title.md
```

Use this structure:

```md
---
title: "My News Title"
meta_title: "My News Title"
description: "Short summary shown in listings and metadata."
date: 2026-06-17T00:00:00Z
image: "/images/news/my-image.webp"
categories: ["News"]
author: "Risso Lab"
tags: ["news"]
draft: false
---

Write the news content here using Markdown.
```

Images should be placed in `public/images/news` and referenced as `/images/news/file-name.webp`.

Set `draft: true` to hide a news item. News dated in the future are not shown until that date.

