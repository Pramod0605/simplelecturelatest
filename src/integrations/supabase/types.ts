export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          answers: Json
          assignment_id: string | null
          feedback: string | null
          graded_at: string | null
          id: string
          percentage: number | null
          score: number | null
          student_id: string | null
          submitted_at: string | null
          time_taken_seconds: number | null
        }
        Insert: {
          answers: Json
          assignment_id?: string | null
          feedback?: string | null
          graded_at?: string | null
          id?: string
          percentage?: number | null
          score?: number | null
          student_id?: string | null
          submitted_at?: string | null
          time_taken_seconds?: number | null
        }
        Update: {
          answers?: Json
          assignment_id?: string | null
          feedback?: string | null
          graded_at?: string | null
          id?: string
          percentage?: number | null
          score?: number | null
          student_id?: string | null
          submitted_at?: string | null
          time_taken_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          chapter_id: string | null
          course_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          duration_minutes: number | null
          homework_date: string | null
          id: string
          is_active: boolean | null
          passing_marks: number | null
          questions: Json
          submission_date: string | null
          title: string
          topic_id: string | null
          total_marks: number | null
        }
        Insert: {
          chapter_id?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          homework_date?: string | null
          id?: string
          is_active?: boolean | null
          passing_marks?: number | null
          questions: Json
          submission_date?: string | null
          title: string
          topic_id?: string | null
          total_marks?: number | null
        }
        Update: {
          chapter_id?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          homework_date?: string | null
          id?: string
          is_active?: boolean | null
          passing_marks?: number | null
          questions?: Json
          submission_date?: string | null
          title?: string
          topic_id?: string | null
          total_marks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "subject_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "subject_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          course_id: string
          created_at: string | null
          current_students: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          max_students: number | null
          name: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          current_students?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          name: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          current_students?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          name?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          added_at: string | null
          course_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          added_at?: string | null
          course_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          added_at?: string | null
          course_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          level: number
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          level: number
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          level?: number
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_goals: {
        Row: {
          category_id: string | null
          created_at: string | null
          goal_id: string | null
          id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          goal_id?: string | null
          id?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          goal_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "explore_by_goal"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          chapter_number: number
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          pdf_url: string | null
          sequence_order: number | null
          subject: string
          title: string
          unlock_threshold: number | null
        }
        Insert: {
          chapter_number: number
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          pdf_url?: string | null
          sequence_order?: number | null
          subject: string
          title: string
          unlock_threshold?: number | null
        }
        Update: {
          chapter_number?: number
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          pdf_url?: string | null
          sequence_order?: number | null
          subject?: string
          title?: string
          unlock_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      class_attendance: {
        Row: {
          id: string
          marked_at: string | null
          notes: string | null
          scheduled_class_id: string
          status: string | null
          student_id: string
        }
        Insert: {
          id?: string
          marked_at?: string | null
          notes?: string | null
          scheduled_class_id: string
          status?: string | null
          student_id: string
        }
        Update: {
          id?: string
          marked_at?: string | null
          notes?: string | null
          scheduled_class_id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_attendance_scheduled_class_id_fkey"
            columns: ["scheduled_class_id"]
            isOneToOne: false
            referencedRelation: "scheduled_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      course_categories: {
        Row: {
          category_id: string
          course_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          category_id: string
          course_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          category_id?: string
          course_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_categories_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_faqs: {
        Row: {
          answer: string
          course_id: string
          created_at: string | null
          display_order: number | null
          id: string
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          course_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          course_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          question?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_faqs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_goals: {
        Row: {
          course_id: string
          created_at: string | null
          goal_id: string
          id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          goal_id: string
          id?: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          goal_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_goals_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "explore_by_goal"
            referencedColumns: ["id"]
          },
        ]
      }
      course_instructors: {
        Row: {
          assigned_at: string | null
          course_id: string
          id: string
          is_primary: boolean | null
          role: string | null
          teacher_id: string
        }
        Insert: {
          assigned_at?: string | null
          course_id: string
          id?: string
          is_primary?: boolean | null
          role?: string | null
          teacher_id: string
        }
        Update: {
          assigned_at?: string | null
          course_id?: string
          id?: string
          is_primary?: boolean | null
          role?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_instructors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_instructors_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_subjects: {
        Row: {
          course_id: string
          created_at: string | null
          display_order: number | null
          id: string
          subject_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          subject_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "popular_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      course_teachers: {
        Row: {
          assigned_at: string | null
          course_id: string
          id: string
          is_primary: boolean | null
          subject: string | null
          teacher_id: string
        }
        Insert: {
          assigned_at?: string | null
          course_id: string
          id?: string
          is_primary?: boolean | null
          subject?: string | null
          teacher_id: string
        }
        Update: {
          assigned_at?: string | null
          course_id?: string
          id?: string
          is_primary?: boolean | null
          subject?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_teachers_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_timetables: {
        Row: {
          academic_year: string
          course_id: string
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          instructor_id: string | null
          is_active: boolean | null
          room_number: string | null
          start_time: string
          subject_id: string | null
          updated_at: string | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          academic_year: string
          course_id: string
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          room_number?: string | null
          start_time: string
          subject_id?: string | null
          updated_at?: string | null
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          academic_year?: string
          course_id?: string
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          room_number?: string | null
          start_time?: string
          subject_id?: string | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_timetables_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_timetables_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_timetables_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "popular_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          ai_tutoring_enabled: boolean | null
          ai_tutoring_price: number | null
          course_includes: Json | null
          created_at: string | null
          description: string | null
          detailed_description: string | null
          duration_months: number | null
          id: string
          instructor_avatar_url: string | null
          instructor_bio: string | null
          instructor_name: string | null
          is_active: boolean | null
          live_classes_enabled: boolean | null
          live_classes_price: number | null
          name: string
          original_price_inr: number | null
          price_inr: number | null
          rating: number | null
          review_count: number | null
          sequence_order: number | null
          short_description: string | null
          slug: string
          student_count: number | null
          subjects: Json | null
          thumbnail_url: string | null
          what_you_learn: Json | null
        }
        Insert: {
          ai_tutoring_enabled?: boolean | null
          ai_tutoring_price?: number | null
          course_includes?: Json | null
          created_at?: string | null
          description?: string | null
          detailed_description?: string | null
          duration_months?: number | null
          id?: string
          instructor_avatar_url?: string | null
          instructor_bio?: string | null
          instructor_name?: string | null
          is_active?: boolean | null
          live_classes_enabled?: boolean | null
          live_classes_price?: number | null
          name: string
          original_price_inr?: number | null
          price_inr?: number | null
          rating?: number | null
          review_count?: number | null
          sequence_order?: number | null
          short_description?: string | null
          slug: string
          student_count?: number | null
          subjects?: Json | null
          thumbnail_url?: string | null
          what_you_learn?: Json | null
        }
        Update: {
          ai_tutoring_enabled?: boolean | null
          ai_tutoring_price?: number | null
          course_includes?: Json | null
          created_at?: string | null
          description?: string | null
          detailed_description?: string | null
          duration_months?: number | null
          id?: string
          instructor_avatar_url?: string | null
          instructor_bio?: string | null
          instructor_name?: string | null
          is_active?: boolean | null
          live_classes_enabled?: boolean | null
          live_classes_price?: number | null
          name?: string
          original_price_inr?: number | null
          price_inr?: number | null
          rating?: number | null
          review_count?: number | null
          sequence_order?: number | null
          short_description?: string | null
          slug?: string
          student_count?: number | null
          subjects?: Json | null
          thumbnail_url?: string | null
          what_you_learn?: Json | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          head_of_department: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          head_of_department?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          head_of_department?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_of_department_fkey"
            columns: ["head_of_department"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          times_used: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          times_used?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          times_used?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      doubt_logs: {
        Row: {
          answer: string | null
          context_used: string | null
          created_at: string | null
          id: string
          model_used: string | null
          question: string
          response_time_ms: number | null
          student_id: string
          topic_id: string | null
        }
        Insert: {
          answer?: string | null
          context_used?: string | null
          created_at?: string | null
          id?: string
          model_used?: string | null
          question: string
          response_time_ms?: number | null
          student_id: string
          topic_id?: string | null
        }
        Update: {
          answer?: string | null
          context_used?: string | null
          created_at?: string | null
          id?: string
          model_used?: string | null
          question?: string
          response_time_ms?: number | null
          student_id?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doubt_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doubt_logs_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      dpt_submissions: {
        Row: {
          answers: Json
          id: string
          questions: Json
          score: number | null
          student_id: string | null
          submitted_at: string | null
          test_date: string | null
          time_taken_seconds: number | null
          total_questions: number | null
        }
        Insert: {
          answers: Json
          id?: string
          questions: Json
          score?: number | null
          student_id?: string | null
          submitted_at?: string | null
          test_date?: string | null
          time_taken_seconds?: number | null
          total_questions?: number | null
        }
        Update: {
          answers?: Json
          id?: string
          questions?: Json
          score?: number | null
          student_id?: string | null
          submitted_at?: string | null
          test_date?: string | null
          time_taken_seconds?: number | null
          total_questions?: number | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          enrolled_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          student_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          student_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_by_goal: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      holidays: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      instructor_subjects: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          instructor_id: string | null
          subject_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          instructor_id?: string | null
          subject_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          instructor_id?: string | null
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_subjects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_subjects_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "popular_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_timetables: {
        Row: {
          academic_year: string
          chapter_id: string | null
          created_at: string | null
          day_of_week: number
          duration_minutes: number | null
          end_time: string
          id: string
          instructor_id: string | null
          is_active: boolean | null
          start_time: string
          subject_id: string | null
          updated_at: string | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          academic_year: string
          chapter_id?: string | null
          created_at?: string | null
          day_of_week: number
          duration_minutes?: number | null
          end_time: string
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          start_time: string
          subject_id?: string | null
          updated_at?: string | null
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          academic_year?: string
          chapter_id?: string | null
          created_at?: string | null
          day_of_week?: number
          duration_minutes?: number | null
          end_time?: string
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          start_time?: string
          subject_id?: string | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_timetables_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "subject_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_timetables_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_timetables_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "popular_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_reads: {
        Row: {
          id: string
          notice_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          notice_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          notice_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notice_reads_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "notices"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_global: boolean | null
          priority: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          priority?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          priority?: string | null
          title?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          payment_id: string | null
          price_inr: number
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          payment_id?: string | null
          price_inr: number
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          payment_id?: string | null
          price_inr?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_inr: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          discount_amount: number | null
          error_message: string | null
          final_amount: number
          gateway_order_id: string | null
          gateway_payment_id: string | null
          id: string
          metadata: Json | null
          order_id: string
          payment_gateway: string | null
          payment_method: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_inr: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          error_message?: string | null
          final_amount: number
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          payment_gateway?: string | null
          payment_method?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_inr?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          error_message?: string | null
          final_amount?: number
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          payment_gateway?: string | null
          payment_method?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      popular_subjects: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      question_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          options: Json
          question_format: string
          subject_id: string | null
          template_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          options: Json
          question_format: string
          subject_id?: string | null
          template_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question_format?: string
          subject_id?: string | null
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_templates_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "popular_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      question_uploads: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_log: Json | null
          failed_questions: number | null
          file_name: string
          id: string
          processed_questions: number | null
          status: string | null
          total_questions: number
          uploaded_by: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_questions?: number | null
          file_name: string
          id?: string
          processed_questions?: number | null
          status?: string | null
          total_questions: number
          uploaded_by: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_questions?: number | null
          file_name?: string
          id?: string
          processed_questions?: number | null
          status?: string | null
          total_questions?: number
          uploaded_by?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          contains_formula: boolean | null
          correct_answer: string
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          formula_type: string | null
          id: string
          is_ai_generated: boolean | null
          is_verified: boolean | null
          marks: number | null
          option_images: Json | null
          options: Json | null
          previous_year_paper_id: string | null
          question_format: string | null
          question_image_url: string | null
          question_text: string
          question_type: string
          subtopic_id: string | null
          topic_id: string | null
          verified_by: string | null
        }
        Insert: {
          contains_formula?: boolean | null
          correct_answer: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          formula_type?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_verified?: boolean | null
          marks?: number | null
          option_images?: Json | null
          options?: Json | null
          previous_year_paper_id?: string | null
          question_format?: string | null
          question_image_url?: string | null
          question_text: string
          question_type: string
          subtopic_id?: string | null
          topic_id?: string | null
          verified_by?: string | null
        }
        Update: {
          contains_formula?: boolean | null
          correct_answer?: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          formula_type?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_verified?: boolean | null
          marks?: number | null
          option_images?: Json | null
          options?: Json | null
          previous_year_paper_id?: string | null
          question_format?: string | null
          question_image_url?: string | null
          question_text?: string
          question_type?: string
          subtopic_id?: string | null
          topic_id?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_previous_year_paper_id_fkey"
            columns: ["previous_year_paper_id"]
            isOneToOne: false
            referencedRelation: "subject_previous_year_papers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "subtopics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "subject_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          course_id: string | null
          id: string
          percentage: number | null
          questions: Json
          quiz_title: string
          score: number | null
          student_id: string | null
          time_taken_seconds: number | null
          total_questions: number | null
        }
        Insert: {
          answers: Json
          completed_at?: string | null
          course_id?: string | null
          id?: string
          percentage?: number | null
          questions: Json
          quiz_title: string
          score?: number | null
          student_id?: string | null
          time_taken_seconds?: number | null
          total_questions?: number | null
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          course_id?: string | null
          id?: string
          percentage?: number | null
          questions?: Json
          quiz_title?: string
          score?: number | null
          student_id?: string | null
          time_taken_seconds?: number | null
          total_questions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_classes: {
        Row: {
          chapter_id: string | null
          course_id: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_cancelled: boolean | null
          is_live: boolean | null
          meeting_link: string | null
          notes: string | null
          room_number: string | null
          scheduled_at: string
          subject: string
          teacher_id: string | null
          timetable_entry_id: string | null
        }
        Insert: {
          chapter_id?: string | null
          course_id: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_cancelled?: boolean | null
          is_live?: boolean | null
          meeting_link?: string | null
          notes?: string | null
          room_number?: string | null
          scheduled_at: string
          subject: string
          teacher_id?: string | null
          timetable_entry_id?: string | null
        }
        Update: {
          chapter_id?: string | null
          course_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_cancelled?: boolean | null
          is_live?: boolean | null
          meeting_link?: string | null
          notes?: string | null
          room_number?: string | null
          scheduled_at?: string
          subject?: string
          teacher_id?: string | null
          timetable_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_scheduled_classes_teacher"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_classes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "subject_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_classes_timetable_entry_id_fkey"
            columns: ["timetable_entry_id"]
            isOneToOne: false
            referencedRelation: "instructor_timetables"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          chapter_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean | null
          is_unlocked: boolean | null
          score: number | null
          student_id: string
          time_spent_seconds: number | null
          topic_id: string | null
          updated_at: string | null
        }
        Insert: {
          chapter_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          is_unlocked?: boolean | null
          score?: number | null
          student_id: string
          time_spent_seconds?: number | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          is_unlocked?: boolean | null
          score?: number | null
          student_id?: string
          time_spent_seconds?: number | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress_2025: {
        Row: {
          chapter_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean | null
          is_unlocked: boolean | null
          score: number | null
          student_id: string
          time_spent_seconds: number | null
          topic_id: string | null
          updated_at: string | null
        }
        Insert: {
          chapter_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          is_unlocked?: boolean | null
          score?: number | null
          student_id: string
          time_spent_seconds?: number | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          is_unlocked?: boolean | null
          score?: number | null
          student_id?: string
          time_spent_seconds?: number | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      student_progress_2026: {
        Row: {
          chapter_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean | null
          is_unlocked: boolean | null
          score: number | null
          student_id: string
          time_spent_seconds: number | null
          topic_id: string | null
          updated_at: string | null
        }
        Insert: {
          chapter_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          is_unlocked?: boolean | null
          score?: number | null
          student_id: string
          time_spent_seconds?: number | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          is_unlocked?: boolean | null
          score?: number | null
          student_id?: string
          time_spent_seconds?: number | null
          topic_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subject_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          subject_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          subject_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_categories_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "popular_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_chapters: {
        Row: {
          ai_generated_podcast_url: string | null
          ai_generated_video_url: string | null
          chapter_number: number
          created_at: string | null
          description: string | null
          id: string
          notes_markdown: string | null
          pdf_url: string | null
          sequence_order: number | null
          subject_id: string
          title: string
          updated_at: string | null
          video_id: string | null
          video_platform: string | null
        }
        Insert: {
          ai_generated_podcast_url?: string | null
          ai_generated_video_url?: string | null
          chapter_number: number
          created_at?: string | null
          description?: string | null
          id?: string
          notes_markdown?: string | null
          pdf_url?: string | null
          sequence_order?: number | null
          subject_id: string
          title: string
          updated_at?: string | null
          video_id?: string | null
          video_platform?: string | null
        }
        Update: {
          ai_generated_podcast_url?: string | null
          ai_generated_video_url?: string | null
          chapter_number?: number
          created_at?: string | null
          description?: string | null
          id?: string
          notes_markdown?: string | null
          pdf_url?: string | null
          sequence_order?: number | null
          subject_id?: string
          title?: string
          updated_at?: string | null
          video_id?: string | null
          video_platform?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subject_chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "popular_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_previous_year_papers: {
        Row: {
          created_at: string | null
          exam_name: string
          id: string
          paper_type: string | null
          pdf_url: string | null
          subject_id: string
          total_questions: number | null
          year: number
        }
        Insert: {
          created_at?: string | null
          exam_name: string
          id?: string
          paper_type?: string | null
          pdf_url?: string | null
          subject_id: string
          total_questions?: number | null
          year: number
        }
        Update: {
          created_at?: string | null
          exam_name?: string
          id?: string
          paper_type?: string | null
          pdf_url?: string | null
          subject_id?: string
          total_questions?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "subject_previous_year_papers_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "popular_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_topics: {
        Row: {
          ai_generated_podcast_url: string | null
          ai_generated_video_url: string | null
          chapter_id: string
          content_markdown: string | null
          created_at: string | null
          estimated_duration_minutes: number | null
          id: string
          notes_markdown: string | null
          pdf_url: string | null
          sequence_order: number | null
          title: string
          topic_number: number
          updated_at: string | null
          video_id: string | null
          video_platform: string | null
          video_url: string | null
        }
        Insert: {
          ai_generated_podcast_url?: string | null
          ai_generated_video_url?: string | null
          chapter_id: string
          content_markdown?: string | null
          created_at?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          notes_markdown?: string | null
          pdf_url?: string | null
          sequence_order?: number | null
          title: string
          topic_number: number
          updated_at?: string | null
          video_id?: string | null
          video_platform?: string | null
          video_url?: string | null
        }
        Update: {
          ai_generated_podcast_url?: string | null
          ai_generated_video_url?: string | null
          chapter_id?: string
          content_markdown?: string | null
          created_at?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          notes_markdown?: string | null
          pdf_url?: string | null
          sequence_order?: number | null
          title?: string
          topic_number?: number
          updated_at?: string | null
          video_id?: string | null
          video_platform?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subject_topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "subject_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      subtopics: {
        Row: {
          ai_generated_podcast_url: string | null
          ai_generated_video_url: string | null
          content_markdown: string | null
          created_at: string | null
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          notes_markdown: string | null
          pdf_url: string | null
          sequence_order: number | null
          title: string
          topic_id: string
          updated_at: string | null
          video_id: string | null
          video_platform: string | null
        }
        Insert: {
          ai_generated_podcast_url?: string | null
          ai_generated_video_url?: string | null
          content_markdown?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          notes_markdown?: string | null
          pdf_url?: string | null
          sequence_order?: number | null
          title: string
          topic_id: string
          updated_at?: string | null
          video_id?: string | null
          video_platform?: string | null
        }
        Update: {
          ai_generated_podcast_url?: string | null
          ai_generated_video_url?: string | null
          content_markdown?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          notes_markdown?: string | null
          pdf_url?: string | null
          sequence_order?: number | null
          title?: string
          topic_id?: string
          updated_at?: string | null
          video_id?: string | null
          video_platform?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subtopics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_joining: string | null
          department_id: string | null
          email: string | null
          employee_id: string | null
          experience_years: number | null
          full_name: string
          id: string
          phone_number: string | null
          qualification: string | null
          specialization: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_joining?: string | null
          department_id?: string | null
          email?: string | null
          employee_id?: string | null
          experience_years?: number | null
          full_name: string
          id: string
          phone_number?: string | null
          qualification?: string | null
          specialization?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_joining?: string | null
          department_id?: string | null
          email?: string | null
          employee_id?: string | null
          experience_years?: number | null
          full_name?: string
          id?: string
          phone_number?: string | null
          qualification?: string | null
          specialization?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      test_submissions: {
        Row: {
          answers: Json
          chapter_id: string | null
          id: string
          score: number | null
          student_id: string
          submitted_at: string | null
          time_taken_seconds: number | null
          topic_id: string | null
          total_marks: number | null
        }
        Insert: {
          answers: Json
          chapter_id?: string | null
          id?: string
          score?: number | null
          student_id: string
          submitted_at?: string | null
          time_taken_seconds?: number | null
          topic_id?: string | null
          total_marks?: number | null
        }
        Update: {
          answers?: Json
          chapter_id?: string | null
          id?: string
          score?: number | null
          student_id?: string
          submitted_at?: string | null
          time_taken_seconds?: number | null
          topic_id?: string | null
          total_marks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_submissions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_submissions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_overrides: {
        Row: {
          course_timetable_id: string | null
          created_at: string | null
          end_time: string
          id: string
          instructor_id: string | null
          is_cancelled: boolean | null
          override_date: string
          reason: string | null
          room_number: string | null
          start_time: string
          subject_id: string | null
        }
        Insert: {
          course_timetable_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          instructor_id?: string | null
          is_cancelled?: boolean | null
          override_date: string
          reason?: string | null
          room_number?: string | null
          start_time: string
          subject_id?: string | null
        }
        Update: {
          course_timetable_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          instructor_id?: string | null
          is_cancelled?: boolean | null
          override_date?: string
          reason?: string | null
          room_number?: string | null
          start_time?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_overrides_course_timetable_id_fkey"
            columns: ["course_timetable_id"]
            isOneToOne: false
            referencedRelation: "course_timetables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_overrides_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_overrides_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "popular_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          ai_slides_url: string | null
          chapter_id: string
          content_markdown: string | null
          content_url: string | null
          created_at: string | null
          estimated_duration_minutes: number | null
          id: string
          sequence_order: number | null
          title: string
          topic_number: number
          video_url: string | null
        }
        Insert: {
          ai_slides_url?: string | null
          chapter_id: string
          content_markdown?: string | null
          content_url?: string | null
          created_at?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          sequence_order?: number | null
          title: string
          topic_number: number
          video_url?: string | null
        }
        Update: {
          ai_slides_url?: string | null
          chapter_id?: string
          content_markdown?: string | null
          content_url?: string | null
          created_at?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          sequence_order?: number | null
          title?: string
          topic_number?: number
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      student_analytics: {
        Row: {
          avg_score: number | null
          chapters_completed: number | null
          course_id: string | null
          last_activity: string | null
          student_id: string | null
          tests_taken: number | null
          topics_completed: number | null
          total_time_spent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_student_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student" | "parent"
      program_type: "live" | "recorded_ai" | "recorded_video"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student", "parent"],
      program_type: ["live", "recorded_ai", "recorded_video"],
    },
  },
} as const
