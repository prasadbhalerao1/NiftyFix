# Runbook — Connect a private GitHub repository and enable CI

Status (4 Nov 2026): **not connected.** No git remote exists and the GitHub CLI is not authenticated on the development machine. Login is interactive, so these steps must be run by the repository owner.

## 1. Authenticate (interactive, once)

```sh
gh auth login --hostname github.com --git-protocol https --web
gh auth status
```

Never paste tokens into repository files, `.env` files or commit messages.

## 2. Create a **private** repository and push

Run from the repository root (`D:\Programming\TOOLS`):

```sh
gh repo create niftyfix --private --source . --remote origin --description "NiftyFix upload-ready file tools" --push
git remote -v          # verify origin points at the private repo
gh repo view --json visibility -q .visibility   # must print PRIVATE
```

This pushes the existing history unchanged (commits `50f4fc3`, `d82e709`, …).

## 3. Watch the first CI run

```sh
gh run list --workflow CI --limit 1
gh run watch            # select the run; exits non-zero if it fails
```

The workflow (`.github/workflows/ci.yml`) runs: frozen-lockfile install, format, lint, tools gate, boundaries, typecheck, unit tests, build, budgets, `pnpm audit --prod`, Playwright (Chromium, Firefox, WebKit, mobile Chrome). The job is named `verify`.

## 4. Protect `main` (after one green run, so the check name exists)

Branch protection on private repositories requires a paid GitHub plan (Pro/Team) or a public repository. On the free plan this call returns HTTP 403; in that case rely on the PR workflow below and re-run when upgrading.

```sh
OWNER=$(gh api user -q .login)
gh api -X PUT "repos/$OWNER/niftyfix/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["verify"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true
}
JSON
```

## 5. Working with pull requests

```sh
git switch -c feature/<name>
# … commit …
git push -u origin feature/<name>
gh pr create --fill
gh pr checks --watch
```

CI runs on every pull request and on pushes to `main`.
