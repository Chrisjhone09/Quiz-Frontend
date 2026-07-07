import { Component, viewChild } from '@angular/core';
import { signal } from '@angular/core';
import { UploadedFileItem } from '../quiz-generator.models';
import { QuizSettings } from '../quiz-settings/quiz-settings';
import { QuizSettingsService } from '../../../services/quiz-settings-service';
import { Router } from '@angular/router';
import { QuizCreationModel } from '../../../interfaces/quizCreation.model';

@Component({
  selector: 'app-upload-syllabus-step',
  imports: [QuizSettings],
  templateUrl: './upload-syllabus-step.html',
  styleUrl: './upload-syllabus-step.css',
})
export class UploadSyllabusStep{


  constructor(private quizService : QuizSettingsService,
                     private route : Router){}
  
  readonly quizSettingsComponent = viewChild(QuizSettings);
  readonly submittedQuizSettings = signal<QuizCreationModel | null>(null);

  readonly uploadedFiles = signal<UploadedFileItem[]>([
  ]);

  selectedFiles: File[] = []


  private fileMap = new Map<number, File>();
  onFileSelected(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (files && files.length) {
        this.processFiles(files);
      }
      input.value = '';
    };
    input.click();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();

    const files = event.dataTransfer?.files;

    if (!files?.length) {
      return;
    }

    const newFiles: UploadedFileItem[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: this.formatFileSize(file.size),
      status: 'Ready'
    }));

    this.uploadedFiles.update(current => [...current, ...newFiles]);
    newFiles.forEach((item, idx) => {
      const file = files.item(idx);
      if (file) {
        this.fileMap.set(item.id, file);
        this.selectedFiles.push(file);
      }
    });

    this.isDragging.set(false);
  }

  removeFile(id: number): void {
    // remove metadata
    this.uploadedFiles.update(current => current.filter(f => f.id !== id));
    // remove raw File from selectedFiles as well
    const file = this.fileMap.get(id);
    if (file) {
      const idx = this.selectedFiles.findIndex(f => f === file || (f.name === file.name && f.size === file.size && f.lastModified === file.lastModified));
      if (idx >= 0) this.selectedFiles.splice(idx, 1);
    }
    this.fileMap.delete(id);
  }

  isDragging = signal(false);
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  async generateQuiz(): Promise<void> {
  const quizSettings = this.quizSettingsComponent()?.submitSettings();

  if (!quizSettings) {
    console.error('Quiz settings are not available');
    return;
  }

  this.submittedQuizSettings.set(quizSettings);

  const formData = new FormData();

  this.selectedFiles.forEach(file => {
    formData.append('files', file);
  });

  formData.append('quizSettings', JSON.stringify(quizSettings));

  this.quizService.generateQuiz(formData).subscribe({
    next: (result) => {
      if (!result.success || !result.data) {
        console.error(result.message || 'Quiz generation failed');
        return;
      }

      this.quizService.setGeneratedQuiz(result.data);
      this.route.navigate(['/quiz-generator/review']);
    },
    error: (error) => {
      console.error('Quiz generation failed', error);
    },
  });

  
}

  onQuizSettingsSubmitted(settings: QuizCreationModel): void {
    this.submittedQuizSettings.set(settings);
  }

  private processFiles(files: FileList) {
    const newFiles: UploadedFileItem[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: this.formatFileSize(file.size),
      status: 'Ready'
    }));

    newFiles.forEach((item, idx) => {
      const file = files.item(idx);
      if (file) {
        this.fileMap.set(item.id, file);
        this.selectedFiles.push(file);
      }
    });

    this.uploadedFiles.update(current => [...current, ...newFiles]);
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
