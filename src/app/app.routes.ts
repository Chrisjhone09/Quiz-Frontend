import { Routes } from '@angular/router';
import { Login } from './features/auth/pages/login/login';
import { Register } from './features/auth/pages/register/register';
import { ForgotPassword } from './features/auth/pages/forgot-password/forgot-password';
import { PasswordReset } from './features/auth/pages/password-reset/password-reset';
import { EmailVerification } from './features/auth/pages/email-verification/email-verification';
import { StudentDashboard } from './features/student/pages/student-dashboard/student-dashboard';
import { Classroom } from './shared/components/classroom/classroom';
import { InstructorDashboard } from './features/instructor/pages/instructor-dashboard/instructor-dashboard';
import { InstructorClassroomDetail } from './features/instructor/pages/instructor-classroom-detail/instructor-classroom-detail';
import { QuizGenerator } from './features/instructor/components/quiz-generator/quiz-generator/quiz-generator';
import { QuizSettings } from './features/instructor/components/quiz-generator/quiz-settings/quiz-settings';
import { UploadSyllabusStep } from './features/instructor/components/quiz-generator/upload-syllabus-step/upload-syllabus-step';
import { ReviewEditStep } from './features/instructor/components/quiz-generator/review-edit-step/review-edit-step';
import { PublishQuizStep } from './features/instructor/components/quiz-generator/publish-quiz-step/publish-quiz-step';
import { Monitoring } from './features/instructor/components/monitoring/monitoring';
import { ManualQuizBuilder } from './features/instructor/pages/manual-quiz-builder/manual-quiz-builder';
import { InstructorSettings } from './features/instructor/pages/instructor-settings/instructor-settings';
import { quizClassroomGuard } from './features/instructor/guards/quiz-classroom.guard';
import { adminGuard, instructorGuard, studentGuard, sessionRedirect, loginGuard } from './shared/guards/role.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: sessionRedirect,
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: Login,
        canActivate: [loginGuard]
    },
    { path: 'register', component: Register },
    { path: 'forgot-password', component: ForgotPassword },
    { path: 'reset-password', component: PasswordReset },
    { path: 'verify-email', component: EmailVerification },
    {
        path: 'student-dashboard', component: StudentDashboard, canActivate: [studentGuard], children:
            [

            ]
    },
    { path: 'student-classroom/:id', component: Classroom, canActivate: [studentGuard] },
    {
        path: 'student-quiz/:quizId',
        canActivate: [studentGuard],
        loadComponent: () => import('./features/student/pages/take-quiz/take-quiz').then(m => m.TakeQuiz)
    },
    {
        path: 'student-quiz-result/:quizId',
        canActivate: [studentGuard],
        loadComponent: () => import('./features/student/pages/quiz-result/quiz-result').then(m => m.QuizResultPage)
    },
    { path: 'instructor-dashboard', component: InstructorDashboard, canActivate: [instructorGuard]},
    { path: 'instructor-settings', component: InstructorSettings, canActivate: [instructorGuard]},
    {
        path: 'admin-dashboard',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/pages/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard)
    },
    {path: 'instructor-classroom/:id', component: InstructorClassroomDetail, canActivate: [instructorGuard], children: [
        {
            path:'requests',
            loadComponent: () => import('./features/instructor/components/enrollment-requests/enrollment-requests').then(m => m.EnrollmentRequests)
        },
        {path:'monitoring', component: Monitoring}
    ]},
    {path: 'quiz-generator', component: QuizGenerator, canActivate: [instructorGuard, quizClassroomGuard], children:
        [
            {path: '', component: UploadSyllabusStep},
            {path: 'review', component: ReviewEditStep},
            {path: 'publish', component: PublishQuizStep}
        ]},
    {path: 'quiz-builder', component: ManualQuizBuilder, canActivate: [instructorGuard]},
    {path: 'quiz-builder/generate', component: ManualQuizBuilder, data: {mode: 'ai'}, canActivate: [instructorGuard]},
    {path: 'quiz-builder/:quizId', component: ManualQuizBuilder, canActivate: [instructorGuard]},
    {path: '**', redirectTo: sessionRedirect}
];
