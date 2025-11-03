import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from "@/lib/queryClient";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import StudentDashboard from "./pages/StudentDashboard";
import MobileHome from "./pages/MobileHome";
import MobileDashboard from "./pages/mobile/MobileDashboard";
import MobileMyAssignments from "./pages/mobile/MobileMyAssignments";
import MobileExplore from "./pages/mobile/MobileExplore";
import MobileProfile from "./pages/mobile/MobileProfile";
import MobileMyLearning from "./pages/mobile/MobileMyLearning";
import MobileMyCourses from "./pages/mobile/MobileMyCourses";
import Implementation from "./pages/Implementation";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import Learning from "./pages/Learning";
import MyCourses from "./pages/MyCourses";
import AITutorial from "./pages/AITutorial";
import Programs from "./pages/Programs";
import MobileCart from "./pages/mobile/MobileCart";
import MobileCheckout from "./pages/mobile/MobileCheckout";
import MobilePaymentSuccess from "./pages/mobile/MobilePaymentSuccess";
import MobileAuth from "./pages/mobile/MobileAuth";
import { AdminProtectedRoute } from "./components/admin/AdminProtectedRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CategoryList from "./pages/admin/CategoryList";
import CategoryForm from "./pages/admin/CategoryForm";
import ExploreByGoalList from "./pages/admin/ExploreByGoalList";
import ExploreByGoalForm from "./pages/admin/ExploreByGoalForm";
import PopularSubjectsList from "./pages/admin/PopularSubjectsList";
import PopularSubjectsForm from "./pages/admin/PopularSubjectsForm";
import CoursesList from "./pages/admin/CoursesList";
import CourseForm from "./pages/admin/CourseForm";
import UsersList from "./pages/admin/UsersList";
import ParentsList from "./pages/admin/ParentsList";
import InstructorsList from "./pages/admin/InstructorsList";
import StaffList from "./pages/admin/StaffList";
import Academics from "./pages/admin/Academics";
import Settings from "./pages/admin/Settings";
import BatchesList from "./pages/admin/BatchesList";
import BatchForm from "./pages/admin/BatchForm";
import BatchDetails from "./pages/admin/BatchDetails";
import SubjectForm from "./pages/admin/SubjectForm";
import QuestionBank from "./pages/admin/QuestionBank";
import UploadQuestionBank from "./pages/admin/UploadQuestionBank";
import VerifyUploadedQuestions from "./pages/admin/VerifyUploadedQuestions";
import AssignmentManager from "./pages/admin/AssignmentManager";
import DepartmentsManager from "./pages/admin/hr/DepartmentsManager";
import InstructorsManager from "./pages/admin/hr/InstructorsManager";
import TimetableManager from "./pages/admin/hr/TimetableManager";
import LiveClassesManager from "./pages/admin/hr/LiveClassesManager";
import AcademicsTimetable from "./pages/admin/AcademicsTimetable";
import HolidaysManager from "./pages/admin/HolidaysManager";
import Documentation from "./pages/admin/Documentation";
import GenerateSeedImages from "./pages/admin/GenerateSeedImages";

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-failed" element={<PaymentFailed />} />
            <Route path="/learning/:courseId/:subjectId" element={<Learning />} />
            <Route path="/ai-tutorial/:topicId" element={<AITutorial />} />
            <Route path="/mobile" element={<MobileHome />} />
            <Route path="/mobile/auth" element={<MobileAuth />} />
            <Route path="/mobile/dashboard" element={<MobileDashboard />} />
            <Route path="/mobile/cart" element={<MobileCart />} />
            <Route path="/mobile/checkout" element={<MobileCheckout />} />
            <Route path="/mobile/payment-success" element={<MobilePaymentSuccess />} />
            <Route path="/mobile/my-assignments" element={<MobileMyAssignments />} />
            <Route path="/mobile/explore" element={<MobileExplore />} />
            <Route path="/mobile/profile" element={<MobileProfile />} />
            <Route path="/mobile/my-learning" element={<MobileMyLearning />} />
            <Route path="/mobile/my-courses" element={<MobileMyCourses />} />
            <Route path="/implementation" element={<Implementation />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="categories" element={<CategoryList />} />
                <Route path="categories/add" element={<CategoryForm />} />
                <Route path="categories/edit/:id" element={<CategoryForm />} />
                <Route path="explore-by-goal" element={<ExploreByGoalList />} />
                <Route path="explore-by-goal/add" element={<ExploreByGoalForm />} />
                <Route path="explore-by-goal/edit/:id" element={<ExploreByGoalForm />} />
                <Route path="popular-subjects" element={<PopularSubjectsList />} />
                <Route path="subjects/add" element={<SubjectForm />} />
                <Route path="subjects/:id/edit" element={<SubjectForm />} />
              <Route path="question-bank" element={<QuestionBank />} />
              <Route path="question-bank/upload" element={<UploadQuestionBank />} />
              <Route path="question-bank/verify" element={<VerifyUploadedQuestions />} />
              <Route path="assignments" element={<AssignmentManager />} />
                <Route path="popular-subjects/add" element={<PopularSubjectsForm />} />
                <Route path="popular-subjects/edit/:id" element={<PopularSubjectsForm />} />
                <Route path="courses" element={<CoursesList />} />
                <Route path="courses/new" element={<CourseForm />} />
                <Route path="courses/:courseId/edit" element={<CourseForm />} />
                <Route path="batches" element={<BatchesList />} />
                <Route path="batches/new" element={<BatchForm />} />
                <Route path="batches/:id" element={<BatchDetails />} />
                <Route path="batches/:id/edit" element={<BatchForm />} />
                <Route path="users" element={<UsersList />} />
                <Route path="parents" element={<ParentsList />} />
                <Route path="instructors" element={<InstructorsList />} />
                <Route path="staff" element={<StaffList />} />
                <Route path="academics" element={<Academics />} />
                <Route path="academics/timetable" element={<AcademicsTimetable />} />
                <Route path="academics/holidays" element={<HolidaysManager />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/documentation" element={<Documentation />} />
                <Route path="settings/generate-images" element={<GenerateSeedImages />} />
                
                {/* Human Resource Routes */}
                <Route path="hr/departments" element={<DepartmentsManager />} />
                <Route path="hr/instructors" element={<InstructorsManager />} />
                <Route path="hr/timetable" element={<TimetableManager />} />
                <Route path="hr/live-classes" element={<LiveClassesManager />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
