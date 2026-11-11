---
title: "Building Dynamic RBAC with Entra ID & User-Level Permission Overrides"
description: "Lessons from designing database-backed authorization with Microsoft Entra ID."
publishedAt: 2026-09-07
updatedAt: 2026-09-07
status: published
tags:
  - Entra ID
  - Security
  - RBAC
  - Backend
featured: true
---

**Lessons from a real system**

## The problem with `if user.role == "admin"`

Most RBAC implementations start with an enum: `employee`, `manager`, and `admin`. It is fast to ship, but it breaks down as soon as the business needs custom roles or a one-off permission for a single user.

The durable solution is to treat roles as data rather than code. Roles can then evolve through an admin workflow without requiring a deployment.

## Start from the data model, not the enum

The core model uses three tables:

- `roles` contains the role catalogue and protects system roles.
- `permissions` contains fine-grained capability codes.
- `role_permissions` maps roles to their default permissions.

This keeps authorization explicit and makes the common case easy to audit.

## Add a user override layer

Per-user overrides handle exceptions without creating a new role for every special case. Each override is a `(user, permission, effect)` record where `effect` is `grant` or `revoke`.

The effective permission set is:

> role defaults ∪ grants − revokes

Resolve that set at login, then include it in the access token. A `token_version` lets the application invalidate existing tokens immediately after a permission or account change.

## Connect Entra groups to roles

Use an admin-editable mapping from an Entra security group to an application role. If a user belongs to conflicting groups, fail the login loudly instead of silently choosing the most privileged role.

Manual changes also need a source marker. IdP synchronisation should update only accounts whose role source is still `idp`; a deliberate manual change must not be overwritten on the next login.

## The privilege boundary

A privilege restriction must be enforced everywhere a role can be attached to an account. Protecting only the login gate is insufficient if an ordinary user-management endpoint can assign the restricted role.

The reliable approach is a shared guard used by account creation, profile edits, and identity-provider mapping flows.

## Takeaways

- Roles should be data, not hardcoded values.
- Per-user grant/revoke overrides prevent role proliferation.
- IdP mappings should be editable and should fail loudly on ambiguity.
- Token versions provide immediate revocation without database reads on every request.
- Every role-assignment path must enforce the same privilege boundary.
