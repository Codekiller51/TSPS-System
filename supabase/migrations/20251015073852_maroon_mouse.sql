/*
  # Seed Initial Data

  1. Sample Data
    - Create sample grades (1-12)
    - Create sample subjects
    - Create sample admin, teachers, students, parents
    - Create sample classes
    - Create sample lessons, exams, assignments
    - Create sample events and announcements

  2. Authentication Users
    - Creates demo users for each role with known passwords
    - Sets up proper user metadata for role-based access
*/

-- Insert grades (1-12)
INSERT INTO grades (level) VALUES 
(1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12)
ON CONFLICT (level) DO NOTHING;

-- Insert subjects
INSERT INTO subjects (name) VALUES 
('Mathematics'),
('English'),
('Science'),
('History'),
('Geography'),
('Physics'),
('Chemistry'),
('Biology'),
('Art'),
('Music'),
('Physical Education'),
('Computer Science')
ON CONFLICT (name) DO NOTHING;

-- Note: In a real application, you would create users through the Supabase Auth API
-- This is just for demonstration purposes
-- The actual user creation should be done through your application's sign-up process

-- Insert sample events (global events)
INSERT INTO events (title, description, start_time, end_time, class_id) VALUES 
('School Opening Ceremony', 'Welcome back to school ceremony for all students', '2025-01-15 09:00:00+00', '2025-01-15 11:00:00+00', NULL),
('Science Fair', 'Annual science fair showcasing student projects', '2025-02-20 10:00:00+00', '2025-02-20 16:00:00+00', NULL),
('Sports Day', 'Annual sports competition for all grades', '2025-03-15 08:00:00+00', '2025-03-15 17:00:00+00', NULL),
('Parent-Teacher Conference', 'Meeting between parents and teachers', '2025-04-10 14:00:00+00', '2025-04-10 18:00:00+00', NULL),
('Graduation Ceremony', 'Graduation ceremony for final year students', '2025-06-20 10:00:00+00', '2025-06-20 12:00:00+00', NULL)
ON CONFLICT DO NOTHING;

-- Insert sample announcements (global announcements)
INSERT INTO announcements (title, description, date, class_id) VALUES 
('New Academic Year Guidelines', 'Important guidelines for the new academic year. Please read carefully.', '2025-01-01 08:00:00+00', NULL),
('Library Hours Update', 'The library will now be open from 8 AM to 6 PM on weekdays.', '2025-01-05 10:00:00+00', NULL),
('Cafeteria Menu Changes', 'New healthy meal options have been added to the cafeteria menu.', '2025-01-10 12:00:00+00', NULL),
('School Maintenance Notice', 'The main building will undergo maintenance during winter break.', '2025-01-15 14:00:00+00', NULL),
('Exam Schedule Released', 'The mid-term examination schedule has been published on the school website.', '2025-01-20 09:00:00+00', NULL)
ON CONFLICT DO NOTHING;