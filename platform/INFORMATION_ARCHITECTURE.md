# Thalium Platform UI — Information Architecture and Navigation Model
# Status: Approved pre-build reference — required before any UI block is written
# Date: 2026-05-22

## Application shell

The platform lives at thalium.io (production) and platform.thalium.dev (staging).

All authenticated views share a persistent shell:
- Left sidebar: primary navigation
- Top bar: org switcher, current Brain Instance context, user menu
- SVG mark (two arcs, central node) always visible in the sidebar header
- Syne typeface throughout; DM Mono for all data/code content

## Authentication boundary

Unauthenticated routes:
  /                  — marketing landing (placeholder only)
  /login             — Supabase Auth (magic link + Google OAuth)
  /signup            — account creation, org creation, first Brain Instance wizard
  /invite/[token]    — team member invitation acceptance

Authenticated routes: everything under /app/...

## Primary navigation (sidebar)

  Instances    /app/instances                  All roles
  Activity     /app/activity                   All roles
  Memory       /app/instances/[id]/memory      Owner, Admin, Developer
  Audit        /app/instances/[id]/audit       Owner, Admin, Developer, Viewer
  Confluence   /app/confluence                 Owner, Admin (Studio+ only — hidden on lower tiers)
  Team         /app/team                       Owner, Admin
  Billing      /app/billing                    Owner, Billing role (hidden for Developer and Viewer)
  Settings     /app/settings                   Owner, Admin

## Page hierarchy

Org-level pages (no Brain Instance context):

  /app/instances           Brain Instance list (Block 36 list view)
  /app/instances/new       Create Brain Instance wizard
  /app/activity            Org-level activity feed and usage dashboard (Block 41 org view)
  /app/confluence          Confluence Manager network graph (Block 39) — Studio+ only
  /app/team                Team members, roles, per-instance scoping
  /app/billing             Subscription, tier, invoices, spend caps, Stripe
  /app/settings            Org settings, API key management (org-level)

Per-Brain-Instance pages (Brain Instance context in sidebar):

  /app/instances/[id]                Brain Instance dashboard (Block 36 detail view)
  /app/instances/[id]/config         Configuration editor (role activation, schemas, guardrails)
  /app/instances/[id]/memory         Memory browser and Coverage Map (Block 37)
  /app/instances/[id]/memory/health  Memory Health panel (Block 38)
  /app/instances/[id]/audit          Audit log viewer and trace explorer (Block 40)
  /app/instances/[id]/artifacts      Artifact registry
  /app/instances/[id]/keys           API key management for this instance
  /app/instances/[id]/usage          Per-instance usage and billing breakdown (Block 41 instance view)

## Block placement on the IA

  Block 36 — Brain Instance dashboard    /app/instances and /app/instances/[id]
  Block 37 — Coverage Map visualisation  /app/instances/[id]/memory
  Block 38 — Memory Health panel         /app/instances/[id]/memory/health
  Block 39 — Confluence Manager          /app/confluence (Studio+ gated)
  Block 40 — Audit log viewer            /app/instances/[id]/audit
  Block 41 — Usage and billing           /app/activity (org) and /app/instances/[id]/usage (instance)

## RBAC visibility rules

  Route                               Owner  Admin  Developer      Viewer         Billing
  /app/instances                      yes    yes    assigned only  assigned only  no
  /app/instances/[id]                 yes    yes    if assigned    if assigned    no
  /app/instances/[id]/config          yes    yes    yes            no             no
  /app/instances/[id]/memory          yes    yes    yes            read-only      no
  /app/instances/[id]/memory/health   yes    yes    yes            read-only      no
  /app/instances/[id]/audit           yes    yes    yes            yes            no
  /app/instances/[id]/artifacts       yes    yes    yes            yes            no
  /app/instances/[id]/keys            yes    yes    yes            no             no
  /app/instances/[id]/usage           yes    yes    yes            no             no
  /app/confluence                     yes    yes    no             no             no
  /app/team                           yes    yes    no             no             no
  /app/billing                        yes    no     no             no             yes
  /app/settings                       yes    yes    no             no             no

Inaccessible Brain Instance routes return 404 not 403 — instance must not be discoverable.

## Destructive operation confirmation requirements

The following require Owner or Admin role plus current session password confirmation:
  - Brain Instance deletion
  - Full ring wipe
  - Memory restore from snapshot
  - Entity wipe (GDPR right-to-erasure)

## Onboarding flow (new account)

  /signup
    email or OAuth
    org name
    first Brain Instance: name and domain selection
    API key shown once with copy prompt
    sandbox state explained
    redirect to /app/instances/[id]

## Trial and sandbox state surfaces

  - Brain Instance card on /app/instances shows sandbox or trial badge
  - /app/instances/[id] shows prominent Activate banner when in sandbox
  - Trial countdown shown in sidebar when live trial is active
  - Post-trial: revert-to-sandbox notice and Subscribe CTA replace Activate banner

## Navigation rules

  - Switching Brain Instance context updates sidebar and all /app/instances/[id]/* routes
  - Deep-linking to /app/instances/[id]/audit works — instance context derived from URL
  - Inaccessible instance IDs in URL return 404 not redirect to list
  - Role changes take effect on next page navigation
