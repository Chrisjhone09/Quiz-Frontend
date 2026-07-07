import { Routes } from '@angular/router';
import { Login } from './features/auth/pages/login/login';
import { Register } from './features/auth/pages/register/register';
import { ForgotPassword } from './features/auth/pages/forgot-password/forgot-password';
import { PasswordReset } from './features/auth/pages/password-reset/password-reset';
import { StudentDashboard } from './features/student/pages/student-dashboard/student-dashboard';
import { Classroom } from './shared/components/classroom/classroom';
import { InstructorDashboard } from './features/instructor/pages/instructor-dashboard/instructor-dashboard';
import { InstructorQuizList } from './features/instructor/components/instructor-quiz-list/instructor-quiz-list';
import { StudentList } from './features/instructor/components/student-list/student-list';
import { QuizGenerator } from './features/instructor/components/quiz-generator/quiz-generator/quiz-generator';
import { QuizSettings } from './features/instructor/components/quiz-generator/quiz-settings/quiz-settings';
import { UploadSyllabusStep } from './features/instructor/components/quiz-generator/upload-syllabus-step/upload-syllabus-step';
import { ReviewEditStep } from './features/instructor/components/quiz-generator/review-edit-step/review-edit-step';
import { PublishQuizStep } from './features/instructor/components/quiz-generator/publish-quiz-step/publish-quiz-step';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/register',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: Login
    },
    { path: 'register', component: Register },
    { path: 'forgot-password', component: ForgotPassword },
    { path: 'reset-password', component: PasswordReset },
    {
        path: 'student-dashboard', component: StudentDashboard, children:
            [

            ]
    },
    { path: 'student-classroom/:id', component: Classroom },
    {
        path: 'student-quiz/:quizId',
        loadComponent: () => import('./features/student/pages/take-quiz/take-quiz').then(m => m.TakeQuiz)
    },
    { path: 'instructor-dashboard', component: InstructorDashboard},
    {path: 'instructor-classroom/:id', component: Classroom, children: [
        {path:'', component: InstructorQuizList},
        {path:'quizzes', component: InstructorQuizList},
        {path:'students', component:StudentList}
    ]},
    {path: 'quiz-generator', component: QuizGenerator, children: 
        [
            {path: '', component: UploadSyllabusStep},
            {path: 'review', component: ReviewEditStep},
            {path: 'publish', component: PublishQuizStep}
        ]}
];
