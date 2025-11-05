# Content Management System (CMS) - Serenity Care Partners

## Overview

A comprehensive, production-ready Content Management System for managing all public website content through an intuitive admin interface. The CMS enables non-technical staff to update website content without touching code.

## Features

### 🎯 **Core Capabilities**

1. **Pages & Sections Management**
   - Create and edit pages with hero sections
   - Add modular content sections to pages
   - Support for multiple content formats (Markdown, HTML, Plain Text)
   - Drag-and-drop section ordering
   - SEO metadata management

2. **Team Members Management**
   - Add leadership and staff profiles
   - Include photos, bios, and contact information
   - Feature members on homepage
   - Department categorization

3. **Testimonials Management**
   - Customer reviews and feedback
   - Star ratings (1-5)
   - Author information and photos
   - Featured testimonials for homepage

4. **Services Management**
   - Care services catalog
   - Service descriptions and features
   - Pricing information
   - Featured services

5. **Organization Settings**
   - Contact information
   - Business hours
   - Trust metrics (satisfaction rates, statistics)
   - Social media links
   - Legal links (privacy policy, terms of service)

6. **Media Library**
   - Centralized asset management
   - Image browsing and selection
   - URL copy functionality
   - Asset metadata

## Architecture

### Database Layer

**Tables Created:**
- `pages` - Website pages (home, about, services, etc.)
- `page_sections` - Modular content blocks within pages
- `team_members` - Leadership and staff profiles
- `testimonials` - Customer reviews
- `services` - Care services catalog
- `media_assets` - Uploaded files and images
- `organization_settings` - Global site settings

All tables include:
- Organization scoping (multi-tenant support)
- Publishing controls
- Audit trails (created_by, updated_by, timestamps)
- Ordering/positioning

### Backend API

**Base URL:** `/api/admin/content`

**Authentication:** JWT Bearer token required
**Authorization:** Admin or super_admin role required

**Endpoints:**

**Pages:**
- `GET /pages` - List all pages
- `GET /pages/:pageId` - Get page with sections
- `POST /pages` - Create page
- `PUT /pages/:pageId` - Update page
- `DELETE /pages/:pageId` - Delete page

**Page Sections:**
- `POST /sections` - Create section
- `PUT /sections/:sectionId` - Update section
- `DELETE /sections/:sectionId` - Delete section

**Team Members:**
- `GET /team-members` - List all
- `POST /team-members` - Create
- `PUT /team-members/:memberId` - Update
- `DELETE /team-members/:memberId` - Delete

**Testimonials:**
- `GET /testimonials` - List all
- `POST /testimonials` - Create
- `PUT /testimonials/:testimonialId` - Update
- `DELETE /testimonials/:testimonialId` - Delete

**Services:**
- `GET /services` - List all
- `POST /services` - Create
- `PUT /services/:serviceId` - Update
- `DELETE /services/:serviceId` - Delete

**Organization Settings:**
- `GET /settings` - Get settings
- `PUT /settings` - Update settings (upsert)

**Media:**
- `GET /media` - List assets
- `DELETE /media/:assetId` - Delete asset

### Frontend Admin UI

**Route:** `/dashboard/content`

**Components:**
- `ContentManager` - Main CMS interface with tabs
- `PagesManager` - Page and section editor
- `TeamMembersManager` - Team profiles
- `TestimonialsManager` - Testimonials editor
- `ServicesManager` - Services catalog
- `OrganizationSettingsManager` - Site settings
- `MediaLibrary` - Media browsing

**Navigation:** Added "Website Content" to admin dashboard sidebar

## User Guide

### Accessing the CMS

1. Log into the admin console
2. Navigate to **"Website Content"** in the sidebar
3. Use the tabs to switch between content types

### Managing Pages

**Create a New Page:**
1. Go to "Pages & Sections" tab
2. Click "+ New Page"
3. Fill in:
   - Page slug (e.g., "about")
   - Page title
   - Hero section details
   - SEO metadata
4. Check "Publish" to make it live
5. Click "Create Page"

**Add Sections to a Page:**
1. Select a page from the list
2. Click "+ New Section"
3. Choose section type:
   - Text - Plain content
   - Features - Feature list
   - Stats - Statistics display
   - CTA - Call to action
   - Image-Text - Image with text
   - Testimonials - Testimonial carousel
   - Services - Services list
   - Team - Team member showcase
4. Fill in content
5. Click "Create Section"

**Ordering Sections:**
- Use the Position field to control display order
- Lower numbers appear first

### Managing Team Members

1. Go to "Team Members" tab
2. Click "+ Add Team Member"
3. Fill in:
   - Full name (required)
   - Title (e.g., "CEO", "Director of Nursing")
   - Department
   - Bio
   - Photo URL
   - Contact info (optional)
4. Check "Featured" to show on homepage
5. Click "Create"

### Managing Testimonials

1. Go to "Testimonials" tab
2. Click "+ Add Testimonial"
3. Fill in:
   - Quote (required)
   - Author name (required)
   - Author title (e.g., "Family Member")
   - Location
   - Rating (1-5 stars)
   - Photo URL
4. Check "Featured" to show on homepage
5. Click "Create"

### Managing Services

1. Go to "Services" tab
2. Click "+ Add Service"
3. Fill in:
   - Service name (required)
   - Service slug (URL-friendly, e.g., "personal-care")
   - Descriptions
   - Features (one per line)
   - Icon and image
   - Pricing
4. Check "Featured" to show on homepage
5. Click "Create"

### Updating Organization Settings

1. Go to "Site Settings" tab
2. Update any of:
   - **Contact Info:** Phone, email, address
   - **Trust Metrics:** Satisfaction rates, statistics
   - **Social Media:** Links to social profiles
   - **Legal:** Privacy policy and terms URLs
3. Click "Save Settings"

### Using the Media Library

**Current Usage:**
- View uploaded media assets
- Click "Copy URL" to copy image URL
- Paste URL into any image field

**For Now:**
- Use high-quality images from [Unsplash](https://unsplash.com)
- Paste image URLs directly into image fields
- File upload feature coming soon

## Best Practices

### Content Writing

✅ **Do:**
- Write clear, concise copy
- Use action-oriented language
- Optimize for SEO (meta descriptions, keywords)
- Preview content before publishing
- Use high-quality images

❌ **Don't:**
- Use excessive jargon
- Leave fields blank
- Forget to set SEO metadata
- Use low-resolution images

### Images

**Recommended Sizes:**
- Hero images: 1920×1080px
- Team photos: 800×800px (square)
- Service images: 1200×800px
- Testimonial photos: 400×400px (square)

**Format:**
- Use JPG for photos
- Use PNG for logos/graphics
- Compress images before using
- Always provide alt text for accessibility

### SEO

**Meta Descriptions:**
- Keep under 160 characters
- Include primary keyword
- Make it compelling

**Keywords:**
- 3-5 relevant keywords per page
- Comma-separated
- Focus on long-tail keywords

### Publishing Workflow

1. **Draft:** Create content with "Published" unchecked
2. **Review:** Preview and proofread
3. **Publish:** Check "Published" and save
4. **Monitor:** Check public website to verify

## Technical Details

### Security

- **Authentication:** JWT with access tokens
- **Authorization:** Role-based (admin/super_admin only)
- **Data Isolation:** Organization-scoped queries
- **Audit Trails:** All changes tracked with user/timestamp

### Validation

- **Backend:** Zod schema validation
- **Frontend:** HTML5 form validation
- **Database:** PostgreSQL constraints

### Performance

- **Indexing:** Database indexes on key fields
- **Caching:** Consider implementing for public endpoints
- **Image Optimization:** Use CDN for media assets

## Migration Path

### Running the Migration

```bash
# Run database migration
psql -U your_user -d serenity -f backend/src/db/migrations/008_create_content_management_tables.sql
```

### Seeding Initial Content

To seed the database with current hardcoded content from the public website:

1. Extract content from `/public-site/app/**/page.tsx` files
2. Insert into database via admin API
3. Update public website to fetch from API

**Example:**

```sql
-- Seed Home page
INSERT INTO pages (organization_id, page_slug, page_title, hero_title, hero_subtitle, published)
VALUES (
  'your-org-id',
  'home',
  'Home',
  'Compassionate Home Care You Can Trust',
  'Pod-based care model for personalized, consistent support',
  true
);
```

## Future Enhancements

### Planned Features

- [ ] File upload for media assets
- [ ] Rich text editor (WYSIWYG)
- [ ] Content versioning and rollback
- [ ] Preview mode before publishing
- [ ] Content scheduling (publish at date/time)
- [ ] Workflow approvals
- [ ] Multi-language support
- [ ] Page templates
- [ ] Content search across all types
- [ ] Bulk operations
- [ ] Import/export content

### API Enhancements

- [ ] Public API for fetching published content
- [ ] GraphQL support
- [ ] Webhooks for content changes
- [ ] Content delivery via CDN

## Support

### Troubleshooting

**Problem:** Changes not appearing on public website
**Solution:** The public website still uses hardcoded content. You need to update the Next.js pages to fetch from the API.

**Problem:** Images not displaying
**Solution:** Verify image URLs are publicly accessible. Use absolute URLs starting with `https://`.

**Problem:** "Permission denied" error
**Solution:** Verify you have admin or super_admin role. Check JWT token is valid.

### Getting Help

- Check backend logs: `backend/logs/`
- Review browser console for frontend errors
- Verify database migrations ran successfully
- Contact system administrator

## Conclusion

The Serenity CMS provides a powerful, user-friendly interface for managing all public website content. With proper usage, non-technical staff can maintain the website without developer intervention, enabling faster updates and more agile marketing.

**Current Status:**
- ✅ Database schema created
- ✅ Backend API complete
- ✅ Admin UI fully functional
- ⏳ Public website integration pending

**Next Step:** Update the Next.js public website to fetch content from the API instead of using hardcoded values.
