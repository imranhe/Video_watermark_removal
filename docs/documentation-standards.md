# Documentation Standards

Project documentation specification guide for the Video Subtitle Removal Mini-Program.

---

## Table of Contents

- [Naming Conventions](#naming-conventions)
- [Format Standards](#format-standards)
- [Structure Standards](#structure-standards)
- [Content Standards](#content-standards)
- [Document Types](#document-types)
- [Review Checklist](#review-checklist)

---

## Naming Conventions

### File Naming

| Rule | Example | Anti-Example |
|------|---------|-------------|
| Use kebab-case (lowercase, hyphen-separated) | `video-uploader.md` | `VideoUploader.md` |
| Use English for file names | `getting-started.md` | `快速开始.md` |
| Chinese content files may retain Chinese names | `牛马去字幕需求文档.md` | `requirements.md` |
| File names must clearly express content | `database-optimization.md` | `db.md` |
| Use `.md` extension for all documentation | `api-reference.md` | `api_reference.txt` |
| Avoid version numbers in file names | `api-reference.md` | `api-reference-v2.md` |
| Avoid dates in file names (use metadata instead) | `audit-report.md` | `audit-report-2024.md` |

### Directory Naming

| Rule | Example |
|------|---------|
| Use kebab-case for directories | `getting-started/` |
| Use English for directory names | `guides/` |
| Use singular nouns for type-based directories | `component/` (not `components/`) |
| Exception: plural nouns when directory holds multiple items of same type | `guides/`, `scripts/` |

### Anchor / Heading Naming

- Use sentence case for headings: `## Getting started` (not `## Getting Started`)
- Use lowercase for anchor links: `#naming-conventions`
- Avoid special characters in headings (except hyphens)

---

## Format Standards

### Encoding and Line Endings

| Setting | Value |
|---------|-------|
| Encoding | UTF-8 (without BOM) |
| Line endings | LF (`\n`) |
| Trailing newline | Yes (one blank line at end of file) |

These settings are enforced by `.editorconfig` and `.gitattributes` at the project root.

### Markdown Syntax

- Use ATX-style headings (`#`, `##`, `###`)
- Maximum heading depth: 4 levels (`####`)
- Use fenced code blocks with language identifiers
- Use `---` (horizontal rule) to separate major sections
- Use `> ` for blockquotes (notes, warnings)
- Use standard Markdown tables for structured data
- Use `- ` for unordered lists (not `* ` or `+ `)
- Use `1. ` for ordered lists
- Images: use relative paths, include alt text

### Code Blocks

Always specify the language identifier:

````markdown
```typescript
const example: string = 'hello'
```

```bash
npm install
```

```sql
SELECT * FROM users WHERE id = 1;
```
````

Supported language identifiers: `typescript`, `javascript`, `vue`, `html`, `css`, `scss`, `json`, `bash`, `sh`, `sql`, `yaml`, `xml`, `markdown`, `text`, `diff`.

### Chinese Text Conventions

- Add a space between Chinese and English/numbers: `使用 TypeScript 开发` (not `使用TypeScript开发`)
- Add a space between Chinese and punctuation following standard CJK rules
- Use Chinese quotation marks for Chinese content: `` "内容" ``, `'内容'`
- Use English quotation marks for code and technical terms: `"string"`, `'path'`

---

## Structure Standards

### General Document Structure

Every document MUST contain:

1. **Title** (H1 heading, one per document)
2. **Table of Contents** (for documents with 3+ sections)
3. **Body content** with clear section divisions
4. **Footer** (last update date, optional)

Template:

```markdown
# Document Title

Brief description of the document purpose.

---

## Table of Contents

- [Section 1](#section-1)
- [Section 2](#section-2)
- [Section 3](#section-3)

---

## Section 1

Content...

---

## Section 2

Content...

---

*Last updated: YYYY-MM-DD*
```

### Heading Hierarchy

```
# Document Title          (H1 - one per file)
## Major Section          (H2 - main sections)
### Sub-section           (H3 - subsections)
#### Detail               (H4 - deepest level)
```

Rules:
- H1 is the document title, used exactly once
- Do not skip heading levels (e.g., H2 directly to H4)
- Each heading should be followed by content (no empty sections)

---

## Content Standards

### Accuracy

- All technical content must be verified before publishing
- Code examples must be tested and working
- API documentation must match actual implementation
- Include version information where applicable

### Completeness

- Cover all required information for the document type
- Include examples for complex concepts
- Provide links to related documentation
- Include troubleshooting section for guides

### Clarity

- Use simple, direct language
- Define technical terms on first use
- Use bullet points and tables for structured information
- Break complex procedures into numbered steps

### Maintenance

- Review documentation at least once per release cycle
- Mark deprecated features clearly with `> **Deprecated**: ...`
- Remove or archive outdated documentation promptly
- Keep code examples up to date with current API

---

## Document Types

| Type | Directory | Template | Description |
|------|-----------|----------|-------------|
| README | `docs/templates/` | `template-readme.md` | Project overview and entry point |
| API Reference | `docs/templates/` | `template-api.md` | Interface specifications |
| Component | `docs/templates/` | `template-component.md` | Component usage documentation |
| Guide | `docs/templates/` | `template-guide.md` | Step-by-step tutorials |
| Report | `docs/reports/` | N/A | Analysis and audit reports |

See `docs/templates/` for the full set of document templates.

---

## Review Checklist

Before submitting documentation, verify:

### Format

- [ ] File uses UTF-8 encoding (no BOM)
- [ ] File uses LF line endings
- [ ] File ends with a single newline
- [ ] File name follows kebab-case convention
- [ ] No trailing whitespace on non-blank lines (except Markdown intentional)

### Structure

- [ ] Document has exactly one H1 title
- [ ] Table of contents is present (if 3+ sections)
- [ ] Heading levels are not skipped
- [ ] Sections are separated by horizontal rules

### Content

- [ ] All links are valid and accessible
- [ ] Code examples are tested and working
- [ ] Technical terms are defined on first use
- [ ] Chinese-English spacing is correct
- [ ] No sensitive information (keys, passwords, tokens)

### Completeness

- [ ] All required sections for document type are present
- [ ] Examples are included for complex concepts
- [ ] Related documents are linked
- [ ] Last updated date is present

---

## Directory Structure

```
docs/
├── README.md                     # Document directory index
├── documentation-standards.md    # This file
├── guides/                       # User guides
│   ├── getting-started.md
│   ├── installation.md
│   └── deployment.md
├── api/                          # API documentation
│   ├── reference.md
│   ├── authentication.md
│   └── endpoints.md
├── components/                   # Component documentation
│   ├── overview.md
│   └── video-uploader.md
├── compliance/                   # Compliance documentation
│   ├── privacy-policy.md
│   ├── terms-of-service.md
│   └── wechat-compliance.md
├── development/                  # Development standards
│   ├── coding-standards.md
│   ├── git-workflow.md
│   └── testing.md
├── database/                     # Database documentation
│   ├── schema.md
│   ├── optimization.md
│   └── maintenance.md
├── reports/                      # Project reports
│   ├── audit-report.md
│   └── optimization-report.md
├── templates/                    # Document templates
│   ├── template-readme.md
│   ├── template-api.md
│   ├── template-component.md
│   └── template-guide.md
└── scripts/                      # Documentation tools
    ├── validate-docs.sh
    ├── generate-index.sh
    └── check-links.sh
```

---

*Last updated: 2026-06-15*
