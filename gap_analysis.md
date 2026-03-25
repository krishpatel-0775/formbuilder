# FormBuilder SRS Gap Analysis

This document identifies functional and architectural discrepancies between the current FormBuilder implementation and the provided Software Requirements Specification (SRS).

## 1. Core Logic & Validation System
**SRS Requirement (2.1, 4.5):** A "simple boolean expression language" (e.g., `field_a == 'Value' && field_b > 10`) must be used for conditional visibility and field-level validations.
- **Status:** [GAP]
- **Current Implementation:** Uses a structured JSON object (`RuleConditionDTO`) with `logicalOperator` (AND/OR) and `operator` (EQUALS, NOT_EQUALS, etc.). This is a significant architectural deviation.
- **Impact:** Less flexibility for complex nested logic and inconsistent with the requirement to use expression strings.

## 2. Schema Management & Governance
**SRS Requirement (4.1, 4.3):**
- Dynamic tables must follow the naming convention `form_data_<form_code>`.
- Schema drift must be detected at startup and during form submission.
- Reserved keywords list (4.2) is extensive.
- **Status:** [GAP]
- **Current Implementation:**
    - Table names use `form_<form_id>` (e.g., `form_1`) instead of the form code.
    - No automatic drift detection at startup or submission.
    - Reserved keyword list in `SchemaManager.java` is significantly smaller than the SRS mandate.
    - Hibernate `ddl-auto=update` is active, which may conflict with the "manual lifecycle management" rule.

## 3. Identification Strategy (UUID vs. BIGINT)
**SRS Requirement (3.6, 5.1):** 
- Every form submission must be assigned a unique **UUID**.
- The `form_submission_meta` table must use **UUID** as its Primary Key.
- **Status:** [GAP]
- **Current Implementation:** All tables, including the dynamic form tables, use `BIGINT` (generated via `BIGSERIAL` / `IDENTITY`) as their primary keys. There is no logic currently generating or storing UUIDs for submissions.
- **Impact:** Inconsistent with the requirement for non-enumerable, globally unique submission identifiers.

## 4. Data Model & Submission Metadata
**SRS Requirement (Data Model 5, 3.6):** A central `form_submission_meta` table is required to store metadata (submitted_by, is_draft, timestamps) for cross-form reporting and access control.
- **Status:** [GAP]
- **Current Implementation:** Metadata is stored directly in each dynamic form table. This prevents efficient cross-form querying and complicates global submission management features requested in the SRS.

## 4. Features & Functional Modules
**SRS Requirement (3.5, 3.7, 7.2):**
- **Calculated Fields:** Real-time calculation based on other fields. [MISSING]
- **Server-Side Export:** Bulk export to CSV/XLSX with formula injection protection. [GAP]
- **Status:** The current implementation uses client-side Excel generation (via `XLSX` library in Next.js). This bypasses server-side security checks for CSV injection (Excel formula protection) and doesn't handle strictly "visible columns" at the database level.

## 5. Security & Session Management
**SRS Requirement (5.1, 8.1, 10.3):**
- 15-minute sliding session timeout.
- Maximum file size limit of 5 MB enforced globally.
- No JWT for session management.
- **Status:** [PARTIAL]
- **Current Implementation:**
    - Session timeout is not explicitly configured to 15m (defaults to standard servlet timeout).
    - File size limits are configurable per-field but not strictly enforced by a global policy in the same way the SRS implies.
    - Authentication aligns with the "simplified cookie-based" approach.

---
## Summary Table

| Requirement Area | SRS Specification | Current Implementation | Gap Type |
| :--- | :--- | :--- | :--- |
| **Logic Engine** | Boolean Expression Language | Structured JSON Rules | Architecture |
| **Persistence** | `form_data_<form_code>` | `form_<id>` | Convention |
| **Metadata** | `form_submission_meta` table | Embedded in dynamic tables | Structural |
| **Validations** | Field-level expression rules | Hardcoded min/max/pattern | Functional |
| **Calculations** | Calculated Fields supported | Not implemented | Feature |
| **Security** | 15m Session Timeout | Standard Timeout | Config |
| **Export** | Server-side + Injection Protection | Client-side (XLSX) | Security |
| **Drift Detection** | Startup & Submission checks | Not implemented | Stability |
