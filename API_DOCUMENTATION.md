# 📋 Dynamic Form Builder API Documentation
**Version:** 1.0.0  
**Base URL:** `http://localhost:9090`  
**Engineer:** Senior Backend Architect

---

# 1. 📖 Overview

A **Dynamic Form Builder System** is a sophisticated architecture that separates form structure (schemas) from form data (responses). Unlike traditional static forms, this system allows administrators to create, modify, and version forms without changing a single line of frontend code.

### How it works:
1. **Frontend Dependence**: The frontend acts as a "dumb" renderer. It calls the **Metadata API** to know what fields to display, what their labels are, and what validation rules to apply.
2. **Submission Logic**: Once the user fills the form, the frontend collects data using unique architectural keys (`fieldKey`) and sends them to the **Submission API**, which stores them in a flexible, dynamic schema.

---

# 2. 🔗 API 1: FORM METADATA API

## 2.1 Endpoint Details
* **Method**: `GET`
* **URL**: `/api/v1/forms/{formId}`
* **Description**: Fetches the complete definition of a form. This is the "Blueprint" used by the frontend to build the UI.

## 2.2 Path Parameters
| Field  | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `formId` | UUID | Yes | The unique identifier of the form. |

## 2.3 Comprehensive Response Structure
The response includes the form container and an exhaustive list of field properties.

### 📂 Form Container Properties:
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier of the form. |
| `formName` | String | Human-readable title. |
| `code` | String | Technical slug/code for the form. |
| `tableName` | String | Database table where submissions are stored. |
| `status` | Enum | `DRAFT` or `PUBLISHED`. |
| `rules` | String | Global form-level logic rules. |
| `formVersionId` | UUID | Current active version identifier. |
| `fields` | Array | Exhaustive collection of field definitions. |

### 📂 Exhaustive Field Properties (Inside `fields`):
| Property | Type | Category | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identity | Unique identifier of the field definition. |
| `fieldName` | String | UI | The **Label** displayed to the user. |
| `fieldKey` | String | Technical | **CRITICAL**: The technical key used in the submission payload. |
| `fieldType` | String | UI | Component type: `text`, `number`, `dropdown`, `date`, `file`, etc. |
| `required` | Boolean | Validation | If true, the field must not be empty. |
| `minLength` | Integer | Validation | Minimum characters allowed (for text). |
| `maxLength` | Integer | Validation | Maximum characters allowed (for text). |
| `min` | Integer | Validation | Minimum numeric value (for number). |
| `max` | Integer | Validation | Maximum numeric value (for number). |
| `pattern` | String | Validation | Regex pattern for validation. |
| `beforeDate` | Date | Validation | Date constraint: must be before this date. |
| `afterDate` | Date | Validation | Date constraint: must be after this date. |
| `beforeTime` | String | Validation | Time constraint: must be before this time. |
| `afterTime` | String | Validation | Time constraint: must be after this time. |
| `options` | List | Data | List of strings for selection components. |
| `sourceTable` | String | Dynamic | Source for remote data population. |
| `sourceColumn` | String | Dynamic | Specific column to fetch for options. |
| `defaultValue` | String | UI | Initial value for the field. |
| `placeholder` | String | UI | Hint text displayed inside the input. |
| `helperText` | String | UI | Descriptive text below the input. |
| `maxFileSize` | Integer | File | Maximum size in MB (for file uploads). |
| `allowedFileTypes`| String | File | Comma-separated extensions (e.g., `.pdf,.jpg`). |
| `isReadOnly` | Boolean | UI | If true, user cannot modify the value. |
| `isMultiSelect` | Boolean | UI | If true, allows multiple selections (for dropdown/list). |

---

## 2.4 Real-World Example: Employee Onboarding (JSON)
This example demonstrates how different field types use specific properties correctly without creating confusion.

```json
{
  "success": true,
  "data": {
    "id": "02ebe36d-5248-4c89-9d99-f36f17df22f0",
    "formName": "Employee Onboarding",
    "status": "PUBLISHED",
    "fields": [
      {
        "fieldName": "Full Name",
        "fieldKey": "full_name",
        "fieldType": "text",
        "required": true,
        "minLength": 3,
        "placeholder": "Enter your full legal name"
      },
      {
        "fieldName": "Date of Birth",
        "fieldKey": "dob",
        "fieldType": "date",
        "required": true,
        "beforeDate": "2006-01-01",
        "helperText": "Must be 18 years or older"
      },
      {
        "fieldName": "Technical Skills",
        "fieldKey": "skills",
        "fieldType": "select",
        "options": ["Java", "React", "Spring Boot", "Next.js"],
        "isMultiSelect": true
      },
      {
        "fieldName": "Resume / CV",
        "fieldKey": "resume_file",
        "fieldType": "file_upload",
        "maxFileSize": 5,
        "allowedFileTypes": ".pdf,.docx"
      },
      {
        "fieldName": "Base Salary Expectation",
        "fieldKey": "salary",
        "fieldType": "number",
        "min": 30000,
        "max": 150000
      }
    ]
  }
}
```

---

# 3. 🔗 API 2: FORM SUBMISSION API

# 3. Submission API
Process and store data collected from your custom frontend renderer.

**Endpoint**: `POST /api/v1/submissions`  
**Content-Type**: `application/json`

---

## 3.1 Request Payload Manifest
Every submission must contain the following structural properties to be processed correctly.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `formId` | `UUID` | **Yes** | The unique ID of the form architecture. |
| `versionId` | `UUID` | **Yes** | The specific version ID (Fetch this from Metadata API). |
| `isDraft` | `Boolean` | No | If `true`, system bypasses strict validation for partial saves. |
| `values` | `Object` | **Yes** | A map where keys are `fieldKey` and values are the input data. |

---

## 3.2 Value Formatting Guide
Data within the `values` object must be formatted based on the `fieldType` defined in the Metadata API.

| Field Type | JSON Value Type | Example |
| :--- | :--- | :--- |
| `text`, `textarea`, `email` | `String` | `"John Doe"` |
| `number` | `Number` | `25` |
| `date`, `time` | `String` | `"2024-05-20"` or `"14:30"` |
| `checkbox`, `multi-select` | `Array<String>` | `["Java", "React"]` |
| `toggle`, `radio` | `String` | `"true"` or `"Option A"` |

---

## 3.3 Example Full Payload
```json
{
  "formId": "02ebe36d-5248-4c89-9d99-f36f17df22f0",
  "versionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "isDraft": false,
  "values": {
    "full_name": "Jane Smith",
    "years_experience": 5,
    "skills": ["Java", "Spring Boot", "AWS"],
    "available_from": "2024-06-01"
  }
}
```

## 2.5 Supported Field Types
The system supports a wide range of field types to handle diverse data collection needs.

### 📝 Text & Inputs
- `text`: Single-line text input.
- `textarea`: Multi-line text area for longer descriptions.
- `email`: Validated email address input.
- `url`: Validated URL/Link input.

### 🔢 Numbers & contact
- `number`: Numeric input with `min` and `max` constraints.
- `phone`: Validated telephone number input.

### ✅ Selection & Choice
- `radio`: Single selection from a list of options.
- `checkbox`: Multiple selections from a list of options.
- `select`: Standard dropdown selection.
- `toggle`: Binary switch (On/Off).

### 📅 Date & Time
- `date`: Date picker with `beforeDate` and `afterDate` validation.
- `time`: Time picker with `beforeTime` and `afterTime` validation.

### 🚀 Advanced
- `file_upload`: File selection with `maxFileSize` and `allowedFileTypes` constraints.

### 🧱 Static Elements (UI Only)
- `heading`: Structural title/heading.
- `paragraph`: Contextual text narrative.
- `divider`: Visual line separation.
- `page_break`: Pagination for multi-step forms.

---

# 4. 🧠 IMPORTANT CONCEPTS

## 4.1 fieldKey Stability
* **Stability**: Unlike `fieldName` (Label), which can be changed for UI purposes, the `fieldKey` is designed to be immutable once assigned, serving as the stable database column mapping.
* **Binding**: Frontend components MUST bind their `name` or `id` attribute to this key.

## 4.2 Field Sequencing & Preservation
*   **Automatic Ordering**: The `fields` array returned in the Metadata API is pre-sorted based on the administrator's layout in the Form Builder.
*   **The Blueprint Rule**: The frontend renderer should iterate through the `fields` array exactly as received. There is no need for manual client-side sorting or secondary "order rules".

## 4.3 Field Key Generation Logic (Slugification)
The system automatically derives the `fieldKey` from the `fieldName` (Label) using a deterministic **Slugification Algorithm**. Developers should understand this logic to predict keys for their submission payloads.

### The Algorithm:
1.  **Lowercase**: All characters are converted to lowercase.
2.  **Trim**: Leading and trailing whitespaces are removed.
3.  **Snake Case**: All internal spaces are replaced with underscores (`_`).
4.  **Sanitize**: All special characters except alphanumeric and underscores are removed.

### 📊 Conversion Examples:
| Input (fieldName / Label) | Output (fieldKey) |
| :--- | :--- |
| `First Name` | `first_name` |
| `Select Course (*)` | `select_course` |
| `Age (Years)` | `age_years` |
| `Email_Address` | `email_address` |

---

## 4.3 Validation Mapping
* The frontend should use the validation properties (`minLength`, `pattern`, etc.) to perform client-side validation BEFORE submission to improve UX.

---

# 5. 🧑‍💻 BEST PRACTICES
1. **Dynamic Rendering**: Do not hardcode form components. Build a generator that consumes the `fields` array.
2. **Handle All Types**: Ensure your UI library supports all `fieldType` values defined in the metadata.
3. **Draft Mode**: Use `isDraft: true` for auto-saving progress without triggering final business logic.

---
*Generated by Antigravity AI Document Engine*
