import { Component, output, signal } from '@angular/core';
import { form, required, validate, FormRoot, FormField } from '@angular/forms/signals';
import { ClassroomCreationModel } from '../../../../shared/interfaces/classroomCreation.model';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { ClassroomModel } from '../../../../shared/interfaces/classrooms.model';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-classroom-dialog',
  imports: [FormRoot, FormField],
  templateUrl: './classroom-dialog.html',
  styleUrls: ['./classroom-dialog.css'],
})
export class ClassroomDialog {

  constructor(private  classroomService : InstructorClassroomService,
              private dialogRef: MatDialogRef<ClassroomDialog>
  ){}

  classroomModel = signal<ClassroomCreationModel>({
    classroomTitle: '',
    description: ''
  });

  classroom = output<ClassroomModel>();

  classroomForm = form(this.classroomModel, (schemaPath) => {
    validate(schemaPath.classroomTitle, ({ value }) => {
      if (value().length > 50) {
        return {
          kind: 'error',
          message: "Title should not exceed more than 50 characters."
        }
      }
      return null;
    }),
      validate(schemaPath.description, ({ value }) => {
        if (value().length > 100) {
          return {
            kind: 'error',
            message: "Description should not exceed more than 100 characters."
          }
        }
        return null;
      })
  },
{
  submission : {
    action: async (field) => {
      this.classroomService.createClassrooom(field().value()).subscribe({
        next: (response : ClassroomModel) => {
          this.dialogRef.close(response);
        }
      })
    }
  }
})

 

}
