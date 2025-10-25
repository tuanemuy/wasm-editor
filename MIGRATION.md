# Database Migration Guide

## Overview

This document describes the migration path for the Note schema changes introduced in PR #5, which adds support for rich content and full-text search.

## Schema Changes

### Previous Schema (Before PR #5)

```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,  -- Plain text or unstructured content
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### New Schema (After PR #5)

```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,  -- Structured JSON for rich text editors
  text TEXT NOT NULL,     -- Plain text extracted from content (for search)
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- New index for full-text search
CREATE INDEX notes_text_idx ON notes(text);
CREATE INDEX notes_created_at_idx ON notes(created_at);
CREATE INDEX notes_updated_at_idx ON notes(updated_at);
```

## Migration Status

⚠️ **Important**: This project currently does not have an automated migration system in place. The `drizzle/` directory for migrations does not exist yet.

## For New Installations

If you are setting up the application for the first time, the new schema will be created automatically. No migration is needed.

## For Existing Installations

### Option 1: Fresh Start (Recommended for Development)

If you don't have important data to preserve:

1. Clear your browser's IndexedDB storage for this application
2. Reload the application
3. The new schema will be created automatically

**Steps to clear IndexedDB:**
- Chrome/Edge: DevTools → Application → Storage → IndexedDB → Right-click → Delete
- Firefox: DevTools → Storage → IndexedDB → Right-click → Delete Database
- Safari: Develop → Show Web Inspector → Storage → IndexedDB → Right-click → Delete

### Option 2: Manual Data Migration (For Production Data)

⚠️ **CAUTION**: This requires manual intervention and should be tested thoroughly.

If you have existing data that you need to preserve, you'll need to:

1. **Export your data** before updating to this version
2. **Backup your IndexedDB** database
3. **Apply the migration manually** using browser DevTools or a custom script

#### Manual Migration Steps

```javascript
// This is a conceptual example - adapt based on your specific needs
// Run this in browser DevTools console before updating the application

async function migrateNotes() {
  // Open IndexedDB connection
  const db = await openDatabase();

  // Get all existing notes
  const notes = await getAllNotes(db);

  // For each note, transform the data
  const migratedNotes = notes.map(note => {
    // If content is plain text, convert to structured format
    const content = typeof note.content === 'string'
      ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: note.content }] }] }
      : note.content;

    // Extract plain text from content
    const text = extractPlainText(content) || ' '; // Must not be empty

    return {
      ...note,
      content: JSON.stringify(content),
      text: text
    };
  });

  // Update each note with new structure
  for (const note of migratedNotes) {
    await updateNote(db, note);
  }

  console.log(`Migrated ${migratedNotes.length} notes`);
}

function extractPlainText(content) {
  // Implement based on your content structure
  // This is just an example
  if (typeof content === 'string') return content;
  if (!content.content) return '';

  return content.content
    .map(node => {
      if (node.type === 'text') return node.text;
      if (node.content) return extractPlainText(node);
      return '';
    })
    .join(' ');
}
```

### Option 3: Wait for Automated Migration System

The project documentation (`spec/database.md`) indicates that a Drizzle-based migration system is planned:

```bash
# Planned migration commands (not yet implemented)
pnpm drizzle-kit generate  # Generate migration files
pnpm drizzle-kit migrate   # Run migrations
```

You may want to wait for this system to be implemented before upgrading if you have critical production data.

## Data Validation

After migration (manual or automated), the application now validates:

1. **Content structure**: Must be valid JSON with a `type` field
2. **Text field**: Must not be empty (minimum 1 character)
3. **Text length**: Must not exceed 100,000 characters

Invalid data will throw errors when loading notes. The error handling added in this PR will help identify problematic records:

- `SystemError` with `DatabaseError` code: JSON parsing failed
- `BusinessRuleError` with specific error codes:
  - `NoteContentInvalid`: Invalid content structure
  - `NoteTextEmpty`: Text field is empty
  - `NoteTextTooLong`: Text exceeds maximum length

## Error Recovery

If you encounter errors after migration:

1. Check browser console for specific error messages
2. Identify the problematic note ID from the error message
3. Use browser DevTools to inspect/fix the corrupted record in IndexedDB
4. Or delete the problematic record if it's not important

## Testing

Before deploying to production:

1. Test the migration process on a copy of your data
2. Verify all notes load correctly
3. Test search functionality
4. Verify tag extraction works
5. Check that new notes can be created

## Future Improvements

This migration guide will be updated when:

1. Automated migration system is implemented
2. Database versioning is added
3. Rollback procedures are established

## Questions or Issues?

If you encounter problems during migration:

1. Check the error messages in browser console
2. Review the validation rules in `app/core/domain/note/valueObject.ts`
3. Open an issue on the GitHub repository with:
   - Browser and version
   - Error messages
   - Steps to reproduce

---

**Last Updated**: 2025-10-25
**Related PR**: #5
**Related Issue**: #2
