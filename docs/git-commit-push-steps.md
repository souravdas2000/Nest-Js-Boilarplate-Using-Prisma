# Git Add Commit Push Steps

1. Check changed files

```bash
git status
```

2. Add files

```bash
git add .
```

3. Commit with Conventional Commit message

```bash
git commit -m "feat(scope): short description"
```

4. Push to current branch

```bash
git push
```

5. If first push of a new branch

```bash
git push -u origin <branch-name>
```

## Commit Message Rules

Format:

```text
<type>(<scope>): <short description>
```

Common types:
- `feat` (new feature)
- `fix` (bug fix)
- `docs` (documentation)
- `refactor` (code refactor)
- `test` (tests)
- `chore` (maintenance)
- `perf` (performance improvement)
- `ci` (CI/CD updates)

Examples:
- `feat(auth): add refresh token rotation`
- `fix(user): handle duplicate email registration`
- `docs(husky): add commit and push steps`
- `refactor(database): simplify prisma service`
- `test(auth): add login service unit tests`
- `chore(deps): update prisma version`
