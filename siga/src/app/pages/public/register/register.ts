import {supabase} from '../../../../../supabase/supabase';

import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../services/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit{

  constructor(private auth: AuthService, private router: Router) {
  }

  email: string = 'nicolaspaiva@outlook.com';
  password: string = 'abc123';
  organizationId: string = '36232177-5ae4-461f-96dc-2178a544da52';
  error: string = '';


  async register() {
    try {
      await this.auth.signUp(this.email, this.password, this.organizationId);
      alert('Registration successful! Please check your email to confirm.');
      this.router.navigate(['/login']);
    } catch (err: any) {
      this.error = err.message;
    }
  }


  ngOnInit(): void {
    this.register();
  }

}
