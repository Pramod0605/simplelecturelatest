-- Phase 12: Seed realistic data for testing
-- This script populates the database with realistic Indian educational context data

-- Insert Categories (Educational hierarchy)
INSERT INTO categories (id, name, slug, description, level, parent_id, display_order, is_active) VALUES
  ('cat-1', 'Engineering Entrance', 'engineering-entrance', 'Prepare for engineering entrance exams like JEE Main and JEE Advanced', 1, NULL, 1, true),
  ('cat-2', 'Medical Entrance', 'medical-entrance', 'Comprehensive preparation for NEET and AIIMS', 1, NULL, 2, true),
  ('cat-3', 'Board Exams', 'board-exams', 'CBSE, ICSE and State board exam preparation', 1, NULL, 3, true),
  ('cat-4', 'Competitive Exams', 'competitive-exams', 'Civil services, banking and other competitive exams', 1, NULL, 4, true),
  ('cat-5', 'JEE Main', 'jee-main', 'JEE Main preparation courses', 2, 'cat-1', 1, true),
  ('cat-6', 'JEE Advanced', 'jee-advanced', 'JEE Advanced preparation courses', 2, 'cat-1', 2, true),
  ('cat-7', 'NEET', 'neet', 'NEET exam preparation', 2, 'cat-2', 1, true),
  ('cat-8', 'Class 11', 'class-11', 'Class 11 board exam preparation', 2, 'cat-3', 1, true),
  ('cat-9', 'Class 12', 'class-12', 'Class 12 board exam preparation', 2, 'cat-3', 2, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Popular Subjects
INSERT INTO popular_subjects (id, name, slug, description, display_order, is_active) VALUES
  ('subj-1', 'Physics', 'physics', 'Master fundamental concepts of physics including mechanics, thermodynamics, electromagnetism, optics and modern physics', 1, true),
  ('subj-2', 'Chemistry', 'chemistry', 'Comprehensive coverage of physical, organic and inorganic chemistry with practical applications', 2, true),
  ('subj-3', 'Mathematics', 'mathematics', 'Complete mathematics curriculum covering algebra, calculus, trigonometry, coordinate geometry and more', 3, true),
  ('subj-4', 'Biology', 'biology', 'In-depth study of botany, zoology, human physiology, genetics and biotechnology', 4, true),
  ('subj-5', 'English', 'english', 'English language, literature, grammar and communication skills', 5, true),
  ('subj-6', 'Computer Science', 'computer-science', 'Programming, data structures, algorithms and computer fundamentals', 6, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Courses
INSERT INTO courses (id, name, slug, short_description, detailed_description, category, price_inr, original_price_inr, duration_months, is_active, ai_tutoring_enabled, live_classes_enabled) VALUES
  ('course-1', 'JEE Main 2026 Complete Course', 'jee-main-2026-complete', 
   'Complete preparation course for JEE Main 2026 with live classes and AI tutor',
   'Our comprehensive JEE Main 2026 course covers the entire syllabus with expert faculty, daily practice problems, weekly tests and doubt clearing sessions. Includes access to our AI tutor for 24/7 doubt resolution.',
   'Engineering Entrance', 0, 0, 12, true, true, true),
  
  ('course-2', 'NEET 2026 Foundation Course', 'neet-2026-foundation',
   'Foundation course for NEET 2026 aspirants with Biology focus',
   'Build strong foundation in Physics, Chemistry and Biology for NEET 2026. Our expert faculty provides concept clarity with MCQ practice and previous year paper analysis.',
   'Medical Entrance', 0, 0, 12, true, true, true),
  
  ('course-3', 'Class 12 Physics Mastery', 'class-12-physics-mastery',
   'Master Class 12 Physics with board exam focus',
   'Complete Class 12 Physics course aligned with CBSE syllabus. Covers all chapters with theory, numericals, practicals and exam-oriented preparation.',
   'Board Exams', 4999, 9999, 6, true, false, false),
  
  ('course-4', 'Class 11 Mathematics Foundation', 'class-11-mathematics-foundation',
   'Strong mathematical foundation for Class 11 students',
   'Comprehensive Class 11 Mathematics course covering algebra, trigonometry, calculus basics and coordinate geometry with detailed problem solving.',
   'Board Exams', 4999, 8999, 6, true, false, false)
ON CONFLICT (id) DO NOTHING;

-- Map Categories to Courses
INSERT INTO course_categories (course_id, category_id) VALUES
  ('course-1', 'cat-1'),
  ('course-1', 'cat-5'),
  ('course-2', 'cat-2'),
  ('course-2', 'cat-7'),
  ('course-3', 'cat-3'),
  ('course-3', 'cat-9'),
  ('course-4', 'cat-3'),
  ('course-4', 'cat-8')
ON CONFLICT DO NOTHING;

-- Map Subjects to Courses
INSERT INTO course_subjects (course_id, subject_id, display_order) VALUES
  ('course-1', 'subj-1', 1),
  ('course-1', 'subj-2', 2),
  ('course-1', 'subj-3', 3),
  ('course-2', 'subj-1', 1),
  ('course-2', 'subj-2', 2),
  ('course-2', 'subj-4', 3),
  ('course-3', 'subj-1', 1),
  ('course-4', 'subj-3', 1)
ON CONFLICT DO NOTHING;

-- Insert Course FAQs
INSERT INTO course_faqs (course_id, question, answer, display_order) VALUES
  ('course-1', 'What is the course duration?', 'The course duration is 12 months with daily live classes and unlimited access to recorded lectures.', 1),
  ('course-1', 'Do I get study materials?', 'Yes, comprehensive study materials including notes, practice sheets and previous year papers are provided.', 2),
  ('course-1', 'Is there doubt clearing support?', 'Yes, we provide 24/7 AI tutor support and scheduled doubt clearing sessions with faculty.', 3),
  ('course-2', 'What subjects are covered?', 'The course covers Physics, Chemistry and Biology as per NEET syllabus.', 1),
  ('course-2', 'Are mock tests included?', 'Yes, weekly mock tests and chapter-wise tests are included to track your progress.', 2),
  ('course-3', 'Is this course for CBSE board?', 'Yes, this course is specifically designed for CBSE Class 12 Physics syllabus.', 1),
  ('course-4', 'Do I need prior knowledge?', 'Basic understanding of Class 10 mathematics is recommended but not mandatory.', 1)
ON CONFLICT DO NOTHING;

-- Insert Batches
INSERT INTO batches (id, course_id, name, start_date, end_date, max_students, current_students, is_active) VALUES
  ('batch-1', 'course-1', 'JEE Main 2026 - Morning Batch', '2025-01-01', '2025-12-31', 100, 45, true),
  ('batch-2', 'course-1', 'JEE Main 2026 - Evening Batch', '2025-01-01', '2025-12-31', 100, 38, true),
  ('batch-3', 'course-2', 'NEET 2026 - Regular Batch', '2025-01-15', '2025-12-31', 150, 67, true),
  ('batch-4', 'course-3', 'Class 12 Physics - Weekend', '2025-01-01', '2025-06-30', 50, 23, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Documentation Pages
INSERT INTO documentation_pages (page_key, title, content, category, subcategory, display_order) VALUES
  ('api-courses-list', 'Get Course List', 
   E'# Get Course List\n\n## Endpoint\n`GET /api/v1/courses`\n\n## Parameters\n- `page` (optional): Page number (default: 1)\n- `limit` (optional): Items per page (default: 20)\n- `category` (optional): Filter by category slug\n\n## Response\n```json\n{\n  "data": [...],\n  "page": 1,\n  "limit": 20,\n  "total": 100,\n  "totalPages": 5\n}\n```',
   'api', 'Courses', 1),
  
  ('api-course-detail', 'Get Course Details',
   E'# Get Course Details\n\n## Endpoint\n`GET /api/v1/courses/:id`\n\n## Response\nReturns complete course information including categories, subjects, instructors and FAQs.',
   'api', 'Courses', 2),
  
  ('inst-courses', 'Managing Courses',
   E'# Managing Courses\n\n## Creating a New Course\n1. Navigate to Admin > Courses\n2. Click "Add Course" button\n3. Fill in course details in the General tab\n4. Select categories in Categories tab\n5. Add subjects in Subjects tab\n6. Assign instructors in Instructors tab\n7. Set pricing in Pricing tab\n8. Add content structure in Content tab\n9. Add FAQs (or generate with AI)\n10. Click Save\n\n## Tips\n- Use AI to generate course descriptions and FAQs\n- Enable AI tutoring for better student support\n- Set appropriate pricing based on course features',
   'instruction', 'Courses', 1),
  
  ('inst-subjects', 'Managing Subjects',
   E'# Managing Subjects\n\n## Adding a New Subject\n1. Go to Admin > Subjects\n2. Click "Add Subject"\n3. Enter subject name and description\n4. Generate AI image or upload custom thumbnail\n5. Set display order\n6. Click Save\n\n## Best Practices\n- Use clear, descriptive names\n- Add comprehensive descriptions\n- Generate professional images using AI',
   'instruction', 'Subjects', 1)
ON CONFLICT (page_key) DO NOTHING;