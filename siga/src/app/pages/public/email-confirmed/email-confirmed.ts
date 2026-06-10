import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Footer } from '../../../components/footer/footer';
import { Navbar } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-email-confirmed',
  standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './email-confirmed.html',
  styleUrl: './email-confirmed.css',
})
export class EmailConfirmed {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  close(): void {
    const destination = this.authService.isAuthenticated() ? '/app/dashboard' : '/login';
    void this.router.navigate([destination]);
  }
}
