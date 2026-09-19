# Incident Response

**Status:** Operations baseline  

---

## Incident classes

1. Security vulnerability  
2. Ethics/disclaimer regression in release  
3. Data corruption / wrong snapshot served  
4. Major reproducibility break  
5. Supply-chain compromise  

---

## Response steps

1. Detect & triage severity.  
2. Contain (yank release, revoke tokens, disable endpoint).  
3. Fix & test.  
4. Disclose per SECURITY policy / release notes.  
5. Postmortem with action items.  

Ethics regressions are treated as **Sev-1** even without data breach.
