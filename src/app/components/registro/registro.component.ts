import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
  registerForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      gmail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      birthday: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.userService.addUser(this.registerForm.value).subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = '🎉 Registro exitoso. Redirigiendo...';

          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 1500);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Error al registrar usuario.';
        }
      });
    } else {
      Object.values(this.registerForm.controls).forEach(control => control.markAsTouched());
    }
  }
  goToRegistro(): void {
    this.router.navigate(['/registro']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
