import { Component, computed, OnInit, signal } from '@angular/core';
import { StatsCardModel } from '../../../student/interfaces/stats-card.model';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { ClassroomModel } from '../../../../shared/interfaces/classrooms.model';
import { ClassroomList } from '../../../../shared/components/classroom-list/classroom-list';
import { MatDialog } from '@angular/material/dialog'
import { ClassroomDialog } from '../../components/classroom-dialog/classroom-dialog';
import { StatsCard } from '../../../../shared/components/stats-card/stats-card';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-instructor-dashboard',
  imports: [StatsCard, ClassroomList, RouterOutlet],
  templateUrl: './instructor-dashboard.html',
  styleUrl: './instructor-dashboard.css',
})
export class InstructorDashboard implements OnInit {


  statsCard = computed<StatsCardModel[] | null>(() => [
    {
      title: "Classrooms",
      value: 2,
      icon: "school"
    },
    {
      title: "Total Published",
      value: 10,
      icon: "publish"
    }
  ])

  readonly classrooms = signal<ClassroomModel[]>([])


  constructor(private classroomService: InstructorClassroomService, private matDialog: MatDialog) { }


  ngOnInit() {
    this.classroomService.getClassrooms().subscribe({
      next: (response: ClassroomModel[]) => {
        this.classrooms.set(response)
        console.log(this.classrooms())
      }
    })
  }


  leaveClassroom(classroomId: string) {
    this.classroomService.leaveClassroom(classroomId).subscribe({
      next: () => {
        console.log("deleted succesfully")
        this.classrooms.update(classrooms => classrooms.filter(c => c.id !== classroomId))
      }
    })
  }

  updateClassroom(classroomId: string) {

  }

  openDialog(): void {
    const dialogRef = this.matDialog.open(ClassroomDialog)

    dialogRef.afterClosed().subscribe((response) => {
      if (!response) return;

      this.classrooms.update(current => [
        ...(current ?? []),
        response
      ]);

    })
  }


}
