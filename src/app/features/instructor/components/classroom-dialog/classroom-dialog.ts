import { Component, inject, output, signal } from '@angular/core';
import { form, required, validate, FormRoot, FormField } from '@angular/forms/signals';
import { ClassroomCreationModel } from '../../../../shared/interfaces/classroomCreation.model';
import { InstructorClassroomService } from '../../services/instructor-classroom-service';
import { ClassroomModel } from '../../../../shared/interfaces/classrooms.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-classroom-dialog',
  imports: [FormRoot, FormField],
  templateUrl: './classroom-dialog.html',
  styleUrls: ['./classroom-dialog.css'],
})
export class ClassroomDialog {

  private readonly classroomService = inject(InstructorClassroomService);
  private readonly dialogRef = inject(MatDialogRef<ClassroomDialog>);

  /** The classroom being edited, if the dialog was opened with one — absent when creating. */
  private readonly editingClassroom = inject<ClassroomModel | null>(MAT_DIALOG_DATA, { optional: true });

  readonly isEditing = !!this.editingClassroom;

  readonly errorMessage = signal('');

  classroomModel = signal<ClassroomCreationModel>({
    classroomTitle: this.editingClassroom?.classroomTitle ?? '',
    description: this.editingClassroom?.description ?? '',
    requiresApproval: this.editingClassroom?.requiresApproval ?? false
  });

  classroom = output<ClassroomModel>();

  /**
   * Bound manually rather than through [formField] — a checkbox is the one control
   * where the signal-forms binding is least predictable, and the model is the
   * source of truth either way.
   */
  toggleRequiresApproval(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.classroomModel.update((model) => ({ ...model, requiresApproval: checked }));
  }

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
      this.errorMessage.set('');

      const request = this.editingClassroom
        ? this.classroomService.updateClassroom(this.editingClassroom.id, field().value())
        : this.classroomService.createClassrooom(field().value());

      request.subscribe({
        next: (response : ClassroomModel) => {
          this.dialogRef.close(response);
        },
        error: (error) => {
          const body = error?.error;
          const message = typeof body === 'string' && body.trim()
            ? body
            : body?.message;
          this.errorMessage.set(
            message?.trim()
              ? message
              : `Could not ${this.editingClassroom ? 'update' : 'create'} the classroom. Please try again.`
          );
        }
      })
    }
  }
})



}
