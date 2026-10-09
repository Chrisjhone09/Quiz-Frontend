import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-force-submit-dialog',
  imports: [MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Submit this attempt?</h2>
    <mat-dialog-content>
      <p>This will end <strong>{{ studentName }}</strong>'s current attempt and submit the answers already entered.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button id="cancel-force-submit" type="button" [mat-dialog-close]="false">Cancel</button>
      <button type="button" class="confirm" [mat-dialog-close]="true"><mat-icon aria-hidden="true">stop_circle</mat-icon>Force submit</button>
    </mat-dialog-actions>
  `,
  styles: `
    :host { display: block; background: #fff; color: #1f2937; }
    p { line-height: 1.5; overflow-wrap: anywhere; }
    mat-dialog-actions { gap: 10px; padding: 16px 24px 24px; }
    button { display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 8px 14px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; color: #374151; font: inherit; cursor: pointer; }
    button.confirm { background: #b91c1c; border-color: #b91c1c; color: #fff; }
    mat-icon { width: 18px; height: 18px; font-size: 18px; }
    button:focus-visible { outline: 3px solid #198754; outline-offset: 3px; }
  `,
})
export class ForceSubmitDialog {
  readonly studentName = inject<string>(MAT_DIALOG_DATA);
}
