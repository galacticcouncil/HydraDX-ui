# Web3 Connect Modal V2 — interaction & balance polish

Status: ready-for-agent

## Problem Statement

The V2 wallet connect modal and the header user menu shipped functional, but the
day-to-day flow still has friction:

- The **Log out all** entry lives inline in the wallet source list on the left.
  It scrolls away with everything else, so with many wallets installed it is
  buried, and there is no fixed place to reach for it.
- Connecting a **multi-mode wallet** (a brand that exposes EVM, Solana, Sui…
  under one name) costs an extra click: pick the mode, approve in the extension,
  then pick the same mode a second time before any accounts appear. Single-mode
  wallets go straight to the account list; the group case does not.
- In **All accounts & wallets**, each provider's group label scrolls out of
  view, so partway down a long list there is nothing saying which wallet the
  visible accounts belong to.
- The header connect button shows an identicon only. With several wallets
  connected there is **no indication which wallet the active account came
  from** — two accounts from different wallets look interchangeable.
- The hover user menu prints **"1 Accounts"** for a single-account wallet.
- In the hover user menu, **Log out all** sits with the wallet rows and
  **Manage wallets** sits alone below the separator, so the two global actions
  are split across sections that do not describe them.
- Accounts from **Solana and Sui** wallets always read **$0**, because the
  Hydration indexer has no balance for them. The cross-chain UI used to show
  the native amount instead (`1.24 SOL`, `8.5 SUI`); the V2 modal lost that.

## Solution

A batch of interaction and display fixes to the wallet management modal, the
header connect button, and the hover user menu:

- Pin **Log out all** to the bottom of the wallet source column as an overlay on
  the scrollable list, with a fade from transparent to the panel background
  above it so it reads as covering more content. Scrolled to the very bottom,
  the button covers nothing — the list ends clear of it.
- Clicking a specific mode inside a multi-mode wallet group connects that mode
  and lands directly on its account list, exactly as a single-mode wallet does.
- Provider group labels in the All accounts & wallets list stick to the top of
  the scroll viewport while their group is on screen, and release as the next
  group's label pushes them out.
- The header connect button's avatar carries a small wallet logo pinned to its
  bottom-right corner, ringed with a border in the button's own background
  colour so it separates cleanly from the identicon behind it.
- The wallet row summary in the hover menu never reads "1 Accounts"; the count
  appears only from two accounts up, and a single-account wallet shows its
  balance alone (or nothing, when there is no balance to show).
- **Log out all** moves down into the same section as **Manage wallets**, so the
  separator divides per-wallet rows from the two global actions.
- Solana and Sui accounts show their native token balance and symbol instead of
  a fiat figure, everywhere an account balance is rendered.

## User Stories

1. As a user with many wallets installed, I want Log out all pinned to the
   bottom of the wallet list, so that I can reach it without scrolling.
2. As a user, I want the wallet list to stay fully scrollable behind the pinned
   button, so that pinning it costs me no reachable wallets.
3. As a user, I want a fade from transparent to the panel background above the
   pinned button, so that I can see there is more list underneath it.
4. As a user who has scrolled to the bottom of the wallet list, I want the last
   wallet to sit clear of the pinned button, so that no entry is ever hidden or
   unclickable.
5. As a user with no wallet connected, I want no pinned Log out all, so that the
   first-connection layout stays uncluttered.
6. As a keyboard user, I want the pinned Log out all to be reachable in tab
   order, so that I can log out without a mouse.
7. As a user connecting a multi-mode wallet, I want clicking a mode to take me
   straight to that mode's accounts once the extension approves, so that I do
   not click the same mode twice.
8. As a user connecting a multi-mode wallet, I want the connecting state to be
   visible while the extension prompt is open, so that I know the click
   registered.
9. As a user whose extension approval fails or is rejected, I want to be
   returned to the mode picker with the error shown, so that I can retry.
10. As a user of a multi-mode wallet with a mode already connected, I want
    clicking that mode to show its accounts immediately, so that a connected
    mode behaves like a connected single-mode wallet.
11. As a user clicking a mode that is not installed, I want the install path
    unchanged, so that this shortcut does not swallow the install affordance.
12. As a user of a multi-mode wallet, I want the group's mode picker still
    reachable, so that I can connect a second mode of the same brand.
13. As a user scrolling All accounts & wallets, I want the current provider's
    label to stick to the top of the list, so that I always know whose accounts
    I am looking at.
14. As a user scrolling past a provider's accounts, I want its label to release
    as the next label arrives, so that only one label is ever pinned.
15. As a user, I want the sticky label to keep its wallet logo and title, so
    that it stays identifiable while pinned.
16. As a user, I want the sticky label to sit above account rows rather than let
    them show through it, so that it stays legible while scrolling.
17. As a user filtering to a single wallet source, I want no sticky labels, so
    that a single-provider list is not topped by a redundant header.
18. As a user with several wallets connected, I want a small wallet logo on the
    header button's avatar, so that I can tell at a glance which wallet the
    active account belongs to.
19. As a user, I want that logo pinned to the avatar's bottom-right corner, so
    that the identicon stays recognisable.
20. As a user, I want the badge ringed in the button's own background colour, so
    that it reads as a separate mark rather than a smudge on the identicon.
21. As a user in either light or dark theme, I want the badge ring to match the
    surrounding background, so that it never shows as a stray light or dark
    outline.
22. As a user with an external (watch-only) address connected, I want a sensible
    mark or none at all, so that the badge is never a broken image.
23. As a user with a multisig account active, I want the badge not to fight the
    existing multisig chip, so that the button stays readable.
24. As a user with exactly one account on a wallet, I want no "1 Accounts" text,
    so that the menu does not state the obvious in broken grammar.
25. As a user with one account and a balance, I want the balance alone on that
    row, so that I still see what the wallet holds.
26. As a user with two or more accounts, I want the count shown, so that I know
    how many accounts that wallet contributes.
27. As a user, I want the count pluralised correctly at every value, so that the
    menu reads as written English.
28. As a user of the hover menu, I want Log out all grouped with Manage wallets,
    so that global actions sit together.
29. As a user of the hover menu, I want the separator between the wallet rows
    and those two actions, so that per-wallet and global actions are visually
    distinct.
30. As a user, I want Log out all to keep closing the menu and disconnecting
    everything, so that moving it changes only its position.
31. As a user with a Solana wallet connected, I want my account to show its
    native SOL balance, so that the list is not a wall of $0.
32. As a user with a Sui wallet connected, I want my account to show its native
    SUI balance, so that the list is not a wall of $0.
33. As a user, I want the native amount to carry its token symbol, so that I can
    tell it apart from a fiat figure.
34. As a user, I want native balances to use the same number formatting as the
    rest of the app, so that they read consistently.
35. As a user whose native balance is still loading, I want the same loading
    treatment as indexer balances, so that the list does not jump.
36. As a user whose native balance query fails, I want the row to render without
    a balance rather than $0, so that I am not told something false.
37. As a user with Solana, Sui and Hydration accounts in one list, I want them
    ordered sensibly rather than by a mixed-unit number, so that the list is not
    arbitrarily shuffled.
38. As a user opening the hover user menu, I want Solana/Sui wallet rows to
    avoid claiming a $0 total, so that the summary is not misleading.
39. As a user, I want all of the above to work at the modal's mobile width, so
    that the phone layout is not broken by the pinned button or sticky labels.

## Implementation Decisions

**Modules touched**

- `@galacticcouncil/web3-connect` — the wallet management content, its source
  column, the account list components and their styled files; the account
  balance hooks; the connect button.
- `apps/main` layout module — the hover user menu and the header connect button
  wrapper.
- `apps/main` locale JSON and the web3-connect locale JSON for the affected
  strings.

**Pinned Log out all**

- The action leaves the scrollable source list and becomes a footer overlaying
  the bottom of the source column's scroll frame, rendered only when at least
  one wallet is connected.
- The overlay is a gradient from transparent to the panel background sitting
  directly above the button; the button itself keeps the existing source-button
  visual so nothing new is invented.
- Clearance is bought with bottom padding on the scroll content sized to the
  footer, not with a magic offset — the last list item must clear the button
  when scrolled to the end.
- The footer sits outside the scroll viewport so it is not affected by
  scrollbar gutter padding.

**Multi-mode group → account list**

- Clicking a mode inside the group picker routes through the same handler a
  single-mode wallet click uses: select that provider as the source, and enable
  it when it is installed and disconnected. Selection happens before the enable
  resolves, so the right panel shows the connecting state and then the accounts
  for that provider without a second click.
- The decision of what a group click does stays in the wallet-source utils
  (already the home of group construction and selectable-wallet filtering)
  rather than being duplicated in the picker component.
- Not-installed modes keep the install behaviour. A rejected or failed enable
  leaves the source selected and shows the existing error state with retry.
- The group entry in the left column still opens the mode picker when more than
  one mode is selectable, so a second mode of the same brand stays reachable.

**Sticky group labels**

- Applies only to the All accounts & wallets view, where accounts are grouped by
  provider; the single-source list renders no labels and is unaffected.
- The label sticks to the top of the scroll viewport with the natural CSS
  mechanism, which requires the Radix scroll viewport's inner wrapper not to
  break the sticky containing block — verify against the shared ScrollArea and
  adjust that component only if it genuinely blocks sticky, since it is used
  across the app.
- The pinned label needs an opaque background matching the panel and a stacking
  order above account rows.

**Header avatar wallet badge**

- The badge is added where the connected-account button renders the identicon,
  so every consumer of that button gets it. It shows the active account's wallet
  logo, absolutely positioned bottom-right, circular, with a ring in the
  button's own background token.
- Providers without a usable logo (external/watch-only) render no badge rather
  than a placeholder.
- Sizing is derived from the avatar size already passed in, so the badge scales
  with it rather than being hard-coded per call site.

**Hover menu account summary**

- The summary string is chosen by count: at one account, show balance only (or
  nothing when there is no balance); at two or more, show count and, when
  present, balance. The count string is pluralised through i18n plural keys
  rather than a hand-built conditional.
- Existing summary keys are renamed/split as needed; unused variants are removed
  from the locale file rather than left dangling.

**Hover menu action grouping**

- Log out all moves below the separator, above or beside Manage wallets, in the
  same section. Its behaviour (disconnect everything, close the menu) is
  unchanged. Only one separator remains between wallet rows and the action pair.

**Solana / Sui native balances**

- `useAccountsWithBalance` becomes the single place that resolves a displayable
  balance for an account: indexer/squid fiat totals for Hydration-compatible
  providers, and native token balance for Solana and Sui accounts via the
  existing native-balance query options in this package.
- An account's resolved balance carries an optional symbol. A symbol present
  means "render as a token amount"; absent means "render as fiat". Account tiles
  and any other balance renderer read that one shape instead of branching on
  provider.
- Native balances are fetched per address through the existing query options
  (already `queryOptions`-shaped, so they compose in `useQueries` alongside the
  indexer batches) and are keyed by account, not public key, since a public key
  can appear under several providers.
- A failed or absent native balance leaves the balance undefined, which the
  tiles already render as empty — never as `0`.
- Sorting must not compare across units. Accounts are ordered active-first, then
  fiat-valued accounts by value, with native-only accounts ordered among
  themselves rather than interleaved by raw number.
- The store's balances map keeps holding fiat values only, so the portfolio and
  user-menu totals are not polluted by token amounts. The user menu's per-wallet
  summary therefore shows no balance for Solana/Sui wallets rather than a false
  `$0`.

## Testing Decisions

Per the developer's call: **no new automated tests for this batch.** Every item
is either a visual/layout change or an interaction change in a component layer
that has no test harness in this repo, and the value of the assertions would not
repay the seams needed to reach them.

- A good test here would exercise external behaviour — "clicking a mode of a
  multi-mode wallet selects that provider and requests an enable" — not the
  internal shape of the source list. The nearest existing prior art is
  `walletSource.test.ts` and `accountFilter.test.ts` in `web3-connect`, both
  pure-function suites over wallet grouping and account filtering.
- If the group-click logic ends up as an exported pure function in the
  wallet-source utils (as the implementation decisions suggest), a case may be
  added to that existing suite opportunistically — but it is not required by
  this spec.
- Verification is manual: run the app, exercise the modal with a multi-mode
  wallet (EVM + Solana under one brand), a Solana-only wallet, a Sui wallet, and
  a single-account substrate wallet; check both themes and the mobile width.
  `yarn lint` and `yarn build` must pass.

## Out of Scope

- Any redesign of the modal layout beyond the specific items listed.
- Fiat pricing for Solana/Sui tokens — this spec shows native amounts only, with
  no conversion.
- Native balances for chains other than Solana and Sui.
- Including Solana/Sui holdings in portfolio totals or the user-menu wallet
  total.
- The wallet discovery debug panel.
- Changes to how wallets are discovered, grouped into brands, or ordered in the
  source list.
- The external/watch-only wallet form.
- Multisig flows, beyond making sure the header badge does not clash with them.
- Any change to the connect modal's first-connection (no wallet connected)
  layout, other than the pinned footer correctly not appearing there.

## Further Notes

- The user menu already guards its summary with
  "more than one account, or a positive balance", so the "1 Accounts" case is
  specifically the single-account-with-balance path picking the count string.
- The old cross-chain account options that showed native SOL/SUI balances were
  removed on this branch, but both native balance hooks survive and are still
  exported — this is a re-wiring, not a reimplementation.
- The shared `ScrollArea` is used well beyond this modal; treat any change to it
  as a cross-cutting edit and check other scroll surfaces if sticky positioning
  forces one.
- Filed as a local markdown spec because the GitHub CLI is not usable from this
  machine (`gh` returns HTTP 403, account suspended) and this repo has no
  configured issue tracker yet.
