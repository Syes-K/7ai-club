# Profile — Technical Design

> **English:** [profile.md](./profile.md)  
> **中文:** [profile-cn.md](./profile-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [prd/profile.md](../prd/profile.md)  
> **Iteration:** iter-03 (base) · **iter-05 (Preferences refactor)**

---

## 1. iter-03 Delivered (summary)

- `user_profiles.nickname`, single `ProfileForm`, static env-based `modelOptions`

---

## 2. iter-05 Changes

### 2.1 Schema

Replace `preferred_model` TEXT with `preferred_model_config_id UUID FK` (NULL = platform default). See [models-cn.md](./models-cn.md) §3.3.

### 2.2 Validation

Split `parseAccountPatch` / `parsePreferencesPatch`. Preference must reference Passed config or NULL (platform default).

### 2.3 Services

- `saveAccount({ nickname })`
- `savePreferences({ preferredModelConfigId })`
- `getPassedModelOptions()` from model configs service

---

## 3. UI

Dual cards: `AccountCard` + `PreferencesCard`, each with View/Edit/Save/Cancel.

Each card uses **section-level busy** on save — [console-shell.md](./console-shell.md) §8.

---

## 4. Files

See [profile-cn.md](./profile-cn.md) §6.

---

## 5. Acceptance

AC-43, AC-44, AC-45 — see [profile-cn.md](./profile-cn.md) §7.

---

## 6. Revision History

| Date | Change |
|------|--------|
| 2026-06-16 | iter-03 initial |
| 2026-06-17 | iter-05 dual cards, FK preference |
| 2026-06-17 | §3 — console-shell §8 section-level busy |
