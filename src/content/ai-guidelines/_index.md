---
title: "AI Guidelines"
meta_title: "AI Guidelines"
description: "How the Risso Lab uses generative AI in research and software development - and how we track provenance with git-ai."
image: ""
draft: true
---

Generative AI is part of our daily workflow: it explains unfamiliar code, drafts tests, suggests refactorings, flags bugs, and ports code between languages. We use it. We also verify everything it produces, because it is a first pass, never the final answer.

The lab applies the [University of Padova policies for the responsible use of generative AI in teaching and research](https://www.unipd.it/policy-ateneo). The document frames generative AI as a support tool, not as a replacement for scientific judgement, and emphasizes human responsibility, transparency, privacy, security, intellectual property, bias awareness, and sustainability.


Both [rOpenSci](https://ropensci.org/blog/2026/02/26/ropensci-ai-policy/) and [pyOpenSci](https://www.pyopensci.org/blog/generative-ai-peer-review-policy.html)
  focus on transparency and human accountability. If generative AI is used to write, refactor, document, or test code, the author should describe how it was used and confirm that the generated material was reviewed, edited, tested, and understood by humans before submission or publication.

## The rules

- **AI assists, humans decide.** Generative AI proposes; it does not conclude. It has no standing for scientific claims, design decisions, security calls, or final correctness.
- **You are responsible.** Code, text, figures, and interpretations submitted under your name are your responsibility. Generated material ships only after it has been checked, tested, and understood.
- **No sensitive data to public tools.** Nothing personal, confidential, proprietary, or unpublished goes into external AI services unless the tool's data-processing terms allow it. Check whether prompts and code are retained or used for training.
- **Document meaningful use.** Substantial AI assistance gets recorded: which tool, what it generated, what humans reviewed. A README entry, a project log, or the disclosure a journal or software review asks for.
- **Review for quality, security, and licenses.** AI-generated code can be wrong, slow, insecure, overcomplicated, or too close to existing licensed code. Extra scrutiny goes to algorithms, domain logic, and anything headed for public release.

## Tool: git-ai

We do not just declare which lines the AI wrote - we record it. The lab uses [git-ai](https://usegitai.com), an open-source Git extension that attaches each line of code to the agent, model, and session that produced it.

### Install

On macOS, Linux, or Windows WSL:

```
curl -sSL https://usegitai.com/install.sh | bash
```

On Windows without WSL:

```
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm http://usegitai.com/install.ps1 | iex"
```

Restart your shell and any running agent session, then install the Git hooks:

```
git ai install-hooks
```

The hooks checkpoint the working tree around every agent edit: before an edit, existing changes are marked human-authored; after, the new changes are marked agent-authored.

### Inspect

After committing:

```
git ai blame hello.py   # git blame, with AI attribution
git ai diff HEAD        # diff annotated with human/AI authorship
git ai stats HEAD       # human vs. AI contribution per commit
```

`git blame`, review tools, and repository history now show which lines came from the agent and which from a human. This does not replace review - it makes provenance inspectable.

### Push attribution to GitHub

Attribution lives in Git notes. To travel them to the remote:

```
git config --add remote.origin.fetch "+refs/notes/*:refs/notes/*"
git config --add remote.origin.push "refs/notes/*:refs/notes/*"
```

Without this, code pushes normally but attribution stays local.

## References

- [University of Padova - policies on the responsible use of generative AI](https://www.unipd.it/policy-ateneo)
- [git-ai documentation](https://usegitai.com)
