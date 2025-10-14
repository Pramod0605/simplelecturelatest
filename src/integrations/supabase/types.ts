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
          total_marks: number | null
        }
        Insert: {
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
          total_marks?: number | null
        }
        Update: {
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
          total_marks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
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
          id: string
          program_id: string | null
          user_id: string | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          program_id?: string | null
          user_id?: string | null
        }
        Update: {
          added_at?: string | null
          id?: string
          program_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
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
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          program_id: string
          sequence_order: number | null
          slug: string
          subjects: Json | null
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          program_id: string
          sequence_order?: number | null
          slug: string
          subjects?: Json | null
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          program_id?: string
          sequence_order?: number | null
          slug?: string
          subjects?: Json | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
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
          created_at: string | null
          id: string
          payment_id: string | null
          price_inr: number
          program_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_id?: string | null
          price_inr: number
          program_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_id?: string | null
          price_inr?: number
          program_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
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
      programs: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration_months: number | null
          features: Json | null
          id: string
          instructor_bio: string | null
          instructor_name: string | null
          is_active: boolean | null
          name: string
          price_inr: number | null
          slug: string
          sub_category: string | null
          thumbnail_url: string | null
          updated_at: string | null
          what_you_learn: string[] | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          features?: Json | null
          id?: string
          instructor_bio?: string | null
          instructor_name?: string | null
          is_active?: boolean | null
          name: string
          price_inr?: number | null
          slug: string
          sub_category?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          what_you_learn?: string[] | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          features?: Json | null
          id?: string
          instructor_bio?: string | null
          instructor_name?: string | null
          is_active?: boolean | null
          name?: string
          price_inr?: number | null
          slug?: string
          sub_category?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          what_you_learn?: string[] | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          marks: number | null
          options: Json | null
          question_text: string
          question_type: string
          topic_id: string | null
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          marks?: number | null
          options?: Json | null
          question_text: string
          question_type: string
          topic_id?: string | null
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          marks?: number | null
          options?: Json | null
          question_text?: string
          question_type?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
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
        }
        Insert: {
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
        }
        Update: {
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
            foreignKeyName: "scheduled_classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
      teacher_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          experience_years: number | null
          full_name: string
          id: string
          phone_number: string | null
          specialization: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          experience_years?: number | null
          full_name: string
          id: string
          phone_number?: string | null
          specialization?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          experience_years?: number | null
          full_name?: string
          id?: string
          phone_number?: string | null
          specialization?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
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
    },
  },
} as const
