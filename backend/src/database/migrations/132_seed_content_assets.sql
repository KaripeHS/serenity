-- ============================================================================
-- Migration: Seed Content Assets with Current Website Images
-- Purpose: Populate content_assets with all images currently used across
--          the public website, enabling management via the admin dashboard.
-- ============================================================================

-- ============================================================================
-- HOME PAGE IMAGES
-- ============================================================================

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('home.hero.background',
   'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?q=80&w=2400&auto=format&fit=crop',
   'Main hero background image on the home page',
   'hero', 'home', 'Compassionate elderly care interaction', 'hero', true, 1)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('home.caregivers.image',
   'https://plus.unsplash.com/premium_photo-1661311814560-8270b2427088?q=80&w=1200&auto=format&fit=crop',
   'Caregiver section main image',
   'caregivers', 'home', 'Caregiver walking with senior outdoors', 'feature', true, 2)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('home.testimonial.jennifer',
   'https://ui-avatars.com/api/?name=Jennifer+M&background=7c9a72&color=fff&size=200&rounded=true',
   'Jennifer M testimonial avatar',
   'testimonials', 'home', 'Jennifer M., family member testimonial', 'testimonial', true, 3)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('home.testimonial.michael',
   'https://ui-avatars.com/api/?name=Michael+R&background=5b7a52&color=fff&size=200&rounded=true',
   'Michael R testimonial avatar',
   'testimonials', 'home', 'Michael R., family member testimonial', 'testimonial', true, 4)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('home.testimonial.sarah',
   'https://ui-avatars.com/api/?name=Sarah+K&background=8fae85&color=fff&size=200&rounded=true',
   'Sarah K testimonial avatar',
   'testimonials', 'home', 'Sarah K., caregiver testimonial', 'testimonial', true, 5)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('home.location.cincinnati',
   'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=800&auto=format&fit=crop',
   'Greater Cincinnati service area card image',
   'locations', 'home', 'Greater Cincinnati area care setting', 'location', true, 6)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('home.location.dayton',
   'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop',
   'Dayton area service area card image',
   'locations', 'home', 'Dayton area care setting', 'location', true, 7)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('home.location.surrounding',
   'https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=800&auto=format&fit=crop',
   'Surrounding areas service area card image',
   'locations', 'home', 'Surrounding areas care setting', 'location', true, 8)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

-- ============================================================================
-- ABOUT PAGE IMAGES
-- ============================================================================

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('about.hero.image',
   'https://plus.unsplash.com/premium_photo-1661311814560-8270b2427088?q=80&w=1200&auto=format&fit=crop',
   'About page hero image',
   'hero', 'about', 'Caregiver walking with senior in a park', 'hero', true, 1)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('about.team.gloria',
   'https://ui-avatars.com/api/?name=Gloria&background=7c9a72&color=fff&size=400&rounded=true&bold=true&font-size=0.4',
   'CEO Gloria headshot (placeholder until real photo uploaded)',
   'team', 'about', 'Gloria, CEO of Serenity Care Partners', 'team', true, 2)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('about.team.bignon',
   'https://ui-avatars.com/api/?name=Bignon&background=5b7a52&color=fff&size=400&rounded=true&bold=true&font-size=0.4',
   'COO/CFO Bignon headshot (placeholder until real photo uploaded)',
   'team', 'about', 'Bignon, COO and CFO of Serenity Care Partners', 'team', true, 3)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('about.podmodel.image',
   'https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=1400&auto=format&fit=crop',
   'Pod model section illustration',
   'pod-model', 'about', 'Healthcare team collaborating in pod-based care model', 'feature', true, 4)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('about.action.image1',
   'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=1000&auto=format&fit=crop',
   'Team in action - caregiver assistance photo',
   'action', 'about', 'Caregiver assisting elderly patient with warmth and care', 'feature', true, 5)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('about.action.image2',
   'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1000&auto=format&fit=crop',
   'Team in action - coordination meeting photo',
   'action', 'about', 'Care coordination team in a planning meeting', 'feature', true, 6)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

-- ============================================================================
-- CAREERS PAGE IMAGES
-- ============================================================================

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('careers.hero.background',
   'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2400&auto=format&fit=crop',
   'Careers page hero background',
   'hero', 'careers', 'Team of professionals collaborating', 'hero', true, 1)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('careers.life.image1',
   'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?q=80&w=800&auto=format&fit=crop',
   'Life at Serenity - compassionate care scene',
   'life', 'careers', 'Caregiver providing compassionate home care', 'feature', true, 2)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('careers.life.image2',
   'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=800&auto=format&fit=crop',
   'Life at Serenity - home health aide',
   'life', 'careers', 'Home health aide assisting client at home', 'feature', true, 3)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('careers.life.image3',
   'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?q=80&w=800&auto=format&fit=crop',
   'Life at Serenity - professional caregiver',
   'life', 'careers', 'Professional caregiver at work', 'feature', true, 4)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('careers.life.image4',
   'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=800&auto=format&fit=crop',
   'Life at Serenity - dedicated team member',
   'life', 'careers', 'Dedicated team member smiling', 'feature', true, 5)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

-- ============================================================================
-- SERVICES PAGE IMAGES
-- ============================================================================

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('services.hero.image',
   'https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1200&auto=format&fit=crop',
   'Services page hero image',
   'hero', 'services', 'Caregiver helping with meal preparation', 'hero', true, 1)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('services.grid.companionship',
   'https://images.unsplash.com/photo-1542884748-2b87b36c6b90?q=80&w=800&auto=format&fit=crop',
   'Companionship service illustration',
   'services-grid', 'services', 'Friendly conversation between caregiver and client', 'feature', true, 2)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('services.grid.personal-care',
   'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?q=80&w=800&auto=format&fit=crop',
   'Personal care service illustration',
   'services-grid', 'services', 'Senior smiling while receiving personal care', 'feature', true, 3)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

INSERT INTO content_assets (key, url, description, section, page, alt_text, image_type, is_external, sort_order)
VALUES
  ('services.grid.respite',
   'https://images.unsplash.com/photo-1573497019236-17f8177b81e8?q=80&w=800&auto=format&fit=crop',
   'Respite care service illustration',
   'services-grid', 'services', 'Senior couple enjoying time together at home', 'feature', true, 4)
ON CONFLICT (key) DO UPDATE SET url = EXCLUDED.url, page = EXCLUDED.page, section = EXCLUDED.section, alt_text = EXCLUDED.alt_text, image_type = EXCLUDED.image_type, is_external = EXCLUDED.is_external;

-- ============================================================================
-- MIGRATION COMPLETE
-- Total: 23 images seeded across 4 pages
-- ============================================================================
