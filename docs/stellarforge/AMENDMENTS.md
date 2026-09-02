# AMENDMENTS

> The Constitution can be amended. It cannot be quietly ignored.
> When a law or gate blocks work that is genuinely right, record the exception
> here — then ship.

An exception recorded three times is a law that has already been repealed in
practice. Make it official or make it stick. Drifting between the two is the
only outcome that's actually bad.

## Format

```
## YYYY-MM-DD · <short title>

**Touches:** Law <n> — <name>  ·  or  Gate: <gate name>
**Scope:** <the specific surface, tool, or component>
**Why:** <what the law would have cost here, concretely>
**Instead:** <what you did>
**Revisit:** <a date, a milestone, or "permanent">
```

## Example

```
## 2026-09-14 · Simulator canvases keep rounded-lg

**Touches:** Design system — zero radius
**Scope:** the five simulator canvases only
**Why:** the Tidelock reference chrome is the most recently tightened surface
  in the app and unifying it with the site idiom would undo that work for no
  legibility gain — the canvases are self-contained and carry no form controls.
**Instead:** documented as the second permitted radius exception alongside Tag.
**Revisit:** permanent, unless the simulators gain form controls.
```

---

## Log

## 2026-09-02 · Cyan returns as a user-selectable PRIMARY ROLE, not as a meaning hue

**Touches:** Design system — SF-II settled decision #3 (legacy cyan `#00D4FF` retired)
**Scope:** `design/themes.py` `PRIMARY_CHOICES` and the `[data-theme="*-cyan"]` blocks only
**Why:** the owner asked for user-switchable colour aesthetics ("green, cyan,
  etc. — yes, I'm reversing"). Decision #3 retired cyan as a *brand meaning*.
  It stays retired in that sense: `sf-cyan` remains an alias to teal, no
  component may write `#00D4FF`, and simulator chrome keeps product teal by
  default. What changes is that `--sf-primary` — the *role* every button,
  focus ring, and link uses — can be set to a contrast-solved cyan by the
  user, exactly like emerald, azure, violet, amber or magenta.
**Instead:** roles live on `sf-primary`; meanings live on named hues. See
  `13-THE-LIFT.md` §0 and the `stellarforge-design` skill.
**Revisit:** if a theme-cyan ever leaks into a `sf-cyan` call site, that is a
  role-on-a-hue bug (`/sf-contrast` check 12), not a reason to reopen this.

## 2026-09-02 · The void is the DEFAULT base, not the only base

**Touches:** `10-LEGIBILITY.md` "void is untouchable"
**Scope:** `design/themes.py` BASES (10 bases, charcoal → sky)
**Why:** same request. Void·Teal is the identity and the default; the
  contrast targets are the constraint, and every base is solved against them.
**Revisit:** never, unless a base fails a target — then fix the base.

