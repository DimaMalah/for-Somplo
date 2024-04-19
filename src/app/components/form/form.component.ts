import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormsModule,
  Validators,
  FormGroup,
} from '@angular/forms';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class FormComponent {
  public currentPositionForGenImage = '0px 0px';
  public currentPosition = '0px 0px';
  public imageHeight = 150;
  public imageWidth = 300;
  public imageFile?: File;
  public imageSrc?: string;
  public form: FormGroup;

  private initialGenImgX = 0;
  private initialGenImgY = 0;
  private isDragging = false;
  private initialX = 0;
  private initialY = 0;
  private genScale = 2;
  private startX = 0;
  private startY = 0;

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.onDragging(event);
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    this.stopDragging();
  }

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      containerWidthPercent: [100],
      containerHeightPercent: [100],
      animation: ['', Validators.required],
      quality: [1],
      scale: [1],
      image: [null],
    });
  }

  public downloadHTML() {
    const blob = new Blob([this.generateHTML()], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'animated-image.html';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  public onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.createImageSrc(file);
    } else {
      console.error('No file selected');
    }
  }

  public revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url);
  }

  public startDragging(event: MouseEvent): void {
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    const positionParts = this.currentPosition.split(' ');
    this.initialX = parseInt(positionParts[0], 10);
    this.initialY = parseInt(positionParts[1], 10);

    const genPositionParts = this.currentPositionForGenImage.split(' ');
    this.initialGenImgX = parseInt(genPositionParts[0], 10);
    this.initialGenImgY = parseInt(genPositionParts[1], 10);

    event.preventDefault();
  }

  private onDragging(event: MouseEvent): void {
    if (!this.isDragging) return;
    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;
    this.currentPosition = `${this.initialX + deltaX}px ${
      this.initialY + deltaY
    }px`;
    this.currentPositionForGenImage = `${
      this.initialGenImgX + deltaX * this.genScale
    }px ${this.initialGenImgY + deltaY * this.genScale}px`;
    event.preventDefault();
  }

  public stopDragging(): void {
    this.isDragging = false;
  }

  private createImageSrc(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imageSrc = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  private generateHTML(): string {
    const { animation, scale, containerWidthPercent, containerHeightPercent } =
      this.form.value;
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Animated Image</title>
      <style>

        .container {
          width: ${containerWidthPercent * 3 * this.genScale}px;
          height: ${containerHeightPercent * 1.5 * this.genScale}px;
          overflow: hidden;
          position: relative;
          margin: 50px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
         }

        img {
          position: absolute;
          height: ${scale * this.imageHeight * this.genScale}px;
          object-position: ${this.currentPositionForGenImage};
          object-fit: cover;
        }

        button {
          padding: 10px;
          border: none;
          border-radius: 5px;
          background-color: #007bff;
          color: white;
          cursor: pointer;
          }

        @keyframes slideFromTop {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(0);
          }
        }

        @keyframes zoomFromButton {
          from {
            transform: scale(0.1);
          }
          to {
            transform: scale(1);
          }
        }

      </style>
    </head>
    <body>

      <div class="container">
        <img id="animatedImage" src="${this.imageSrc}" alt="Animated Image">
      </div>

      <button onclick="playAnimation()">Play Animation</button>

      </body>

      <script>

        function playAnimation() {
          const image = document.getElementById('animatedImage');
          image.style.animation = 'none';
          setTimeout(() => {
            image.style.animation = '';
            image.style.animation = '${animation} 2s ease forwards';
          }, 10);
        }

      </script>
    </html>`;
  }
}
