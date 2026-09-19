# MAIN Writing v1.2 — release verification

Status: implementation and isolated browser QA; production publication held until review and actual save gate pass.

Core:57a69136b7473718dfcf26311ae801f033696f05. Base/main:1689a757208c5a9667e72fe11496065ecc946583. Branch:feat/main-writing-v1-2-formatting. Previous production/rollback:6aadc5abb7561cd759f6c1e3. Existing site9c0bd872-1f70-4468-b853-e87b9b3269d5. Gate Full; no Admin/system installation.

Scope: existing editor toolbar and article-wide17/18/19/20px size, default18. Canonical Markdown and exact-owner security retained. No DB/Auth/SMTP/Registry/presentation/DNS changes or new dependencies.

Initial tests62/62 passed; independent review found edge cases missed by those tests. Fixes add multi-paragraph toggles, safe refusal for ambiguous partial/mixed/structural selections and NUL parser protection. Final test/review evidence follows before release.

Actual Chrome isolated QA uses current approved article in memory only: mouse drag text selection -> Bold -> Italic ->20px preview ->save ->refresh all passed; title32px,metadata13px,index13px unchanged at1440px.17px selector saves and survives deep URL.390x844 owner toolbar wraps without overflow, light/dark article visuals inspected. This is viewport QA, not physical-device touch acceptance.

Final local validation/build and65/65 tests PASS. Independent reviewer37/37 targeted tests PASS plus original failure reproductions; no unresolved actionable finding. Reviewed format SHA256E356821BB849F31DBF12E5F15FF27C0490D23EDF8FC632FE2C8197F12D0C8EDB and content SHA256F760FC1C6CE0A674B9FAD15737F1930E184DD4DC514F9B799A4836C0357BB590.
