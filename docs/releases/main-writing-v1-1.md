# MAIN Writing v1.1 — release evidence

Status: CANDIDATE; no production release yet.
Core:7a11fa58253cbd2e1587a97e01af15e054aec442, current canonical AGENTS/AI_CORE and required architecture/services/workflow/workspace/communication/gate/UI/tool references read. Gate Full; existing Node/CLI/PGlite only, no Admin/system installation.
Initial main:97c9322; clean, origin matched. Feature branch:feat/main-writing-v1-1-polish. Production/rollback:6aada2062630da334a6f46db, existing Netlify site9c0bd872-1f70-4468-b853-e87b9b3269d5, no Git CD. One approved article retained byte-for-byte in canonical source. No Product schema/records,Auth/SMTP,DNS,other apps or original media changes.

Requirements1–5,13,16–17:contextual editor,all named metadata/body fields,cover/inline asset selection/upload,exact owner server validation,Git canonical writes,tags preservation implemented. Requirements6–12,15:880px/86dvh floating shell,frosted layering,sans18px body/17pxmobile,~651px desktop measure,170pxsidebar,compact leftheader,singular/plural card. Requirement14:independent order/feature/home with200article bounded backend. Requirements18–21:tests and actualbrowser evidence below. Requirements22–24:release pending.

Independent reviewer /root/writing_security_review PASS after two fixes: navigation invalidates delayed edit reads; save uses committed public_article and public reads validate current main SHA across instances. Reviewer ran25focusedtests, no remaining code/security blockers. Separate visual implementation agent owned only CSS/card/header; backend agent owned only new handler/API tests. Root integrated and performed browserQA. Authors' own checks are not labelled independent review.

Real Chrome isolated QA:owner edited title/body/excerpt/video/LinkedIn and uploaded cover+inline WebP, saved, then reloaded. Updated body and two immutable image URLs persisted and decoded. Set featured on second article, moved first article to top of index, saved/reloaded; homepage featured stayed second and home position unchanged. Close leaves only Arrange cards; mobile Back/Forward and list transition passed. Logout removed allProduct links and allWriting owner buttons immediately. No console warnings/errors. Test fixtures remained in memory/dist-qa only.
Approved article visualQA:1440x1000 panel880x860,grid1032,body~651px,18px/29.7px;768x1024 panel688px;390x844 full-width17pxbody. Light/dark inspected at all three breakpoints, nooverflow/brokenimages. Current Tracker/UMS/Capture production visualreferences inspected read-only. Existing real article Markdown/image unmodified.

Remaining gates:final complete suite,Netlify protectedpreview,canonicalpush/merge,newbackendrelease,singlefrontendpromotion,productionreadback/ownereditor verification. Real physical-device touch not newly tested; actualChrome viewporttests and existing touch regression retained.

## Release checkpoint

- Feature commit: `4ec90f7e216280addb57c4ba725d92ff01f6aa30`, pushed on `feat/main-writing-v1-1-polish`; not merged to main.
- Final local validation: `npm run validate`, `npm run build`, and all 51 tests passed.
- `MAIN_WRITING_GITHUB_TOKEN` configuration confirmed by secret name only; value was not retrieved or displayed. Actual production GitHub write remains unverified.
- Draft deploy `6aadad55588dbc213eb5a13e` is ready at https://6aadad55588dbc213eb5a13e--ycsu-platform-registry.netlify.app. Existing preview access protection is preserved.
- Remote preview browser QA is BLOCKED: repeated Chrome extension connection timeouts, including recovery after documentation reload. Ready status is not UI acceptance.
- No new Supabase function deployed; no frontend production promotion. Existing production rollback remains `6aada2062630da334a6f46db`.
- Resume after browser reconnection: protected preview QA, normal main merge/push, deploy only `writing-content` using API bundling, verify backend, promote accepted frontend artifact once, then production browser and canonical readback checks.

## Backend release checkpoint after owner preview acceptance

The owner confirmed the remote preview normal. This is user-performed acceptance; automated remote browser control remained unavailable despite reconnection/restart.

- Canonical main merged and pushed: `ff463beeeaf9b84daa5ed21a944d88ed625ac391`.
- New `writing-content` function deployed to `fzydsnxxcdllkjxwdiwn` using API bundling; no other function or DB changed.
- Production backend checks: guest read 401, invalid session 403, foreign Origin 403. Public read returned 503 `CONTENT_UNAVAILABLE`.
- Diagnostic: the exact same handler, executed locally against the current public canonical GitHub repo without credentials, returned 200 and the one approved article; all nine GitHub reads returned 200. This narrows the problem to the deployed environment/upstream access, but does not prove whether the configured token or another upstream condition is the cause.
- Requested owner verification of fine-grained token validity, repository selection and Contents read/write. No credential value retrieved or displayed.
- FRONTEND RELEASE HOLD: do not promote draft until deployed content read succeeds. Current frontend remains `6aada2062630da334a6f46db`; candidate remains `6aadad55588dbc213eb5a13e`. Production editor save/image verification is still pending.

## Deployed 7f3f5fa verification — credential blocker confirmed

Backend source: `7f3f5fac1e0cee12db272331c860fa241ae4338e`. Full validate/build and 53/53 tests passed. Public reads never retrieve or send MAIN_WRITING_GITHUB_TOKEN. Owner reads/saves retain exact confirmed owner auth. GitHub failures now expose only bounded HTTP status/class diagnostics, with no upstream response body or credential.

Actual live evidence:
- writing-content read-public: HTTP 200, one approved article. Direct unauthenticated GitHub main-ref read: HTTP 200 at the same canonical source.
- Guest read-article/save-article: HTTP 401. Invalid owner session: HTTP 403.
- Chrome control recovered. A temporary loopback-only candidate server connected the real pinned Auth SDK to the existing Supabase project and proxied only fixed Auth routes and permitted function operations. No existing browser session was exported, no owner-auth bypass was added, no CORS/production permission was changed, and no credential/request bodies were logged.
- Normal six-digit owner OTP login completed through the browser; deployed registry owner authorization/read returned 200. Candidate Edit Article invoked the deployed writing-content with the real owner session.
- **Exact deployed editor result:** HTTP 502 envelope; `diagnostic.github_status=401`, `diagnostic.response_class=authentication_failed`. GitHub rejected the editor credential. This is an observed backend result, not an inference from public access.
- The article editor failed closed; no article save was possible or attempted because owner read did not produce a valid revision. No article/media/Registry/presentation content was changed.
- Actual candidate sign-out removed visible owner controls and Product links immediately. Article refresh retained public article content; only Owner sign in and Close were visible, with zero Product anchors. This verifies logout UI but does not satisfy the blocked owner-save gate.
- Public read remained HTTP 200 after owner failure. Dist and public response scans found no GitHub token patterns, editor-secret names or service-role patterns; raw upstream errors/credentials are not returned. This is a bounded exposure check, not a claim to have read the secret.
- Temporary QA server stopped and candidate tab closed.

Frontend remains deployment `6aada2062630da334a6f46db`; Git CD remains disconnected. **RELEASE HOLD** until replacing the GitHub token in Supabase permits actual owner edit/read, save/readback and subsequent logout verification. Owner should perform only the account-secret replacement; agent must verify behavior rather than ask the owner to check settings or perform QA.
