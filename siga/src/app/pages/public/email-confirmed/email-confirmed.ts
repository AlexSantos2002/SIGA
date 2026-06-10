import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '../../../../../supabase/supabase';
import { Footer } from '../../../components/footer/footer';
import { Navbar } from '../../../components/navbar/navbar';
import { AuthService } from '../../../services/auth/auth.service';

type ConfirmationState = 'verifying' | 'success' | 'error';
type ConfirmationText = {
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  closeLabel: string;
  verifyingTitle: string;
  verifyingDescription: string;
  successTitle: string;
  successDescription: string;
  errorTitle: string;
  errorDescription: string;
  continueLabel: string;
  loginLabel: string;
};

@Component({
  selector: 'app-email-confirmed',
  standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './email-confirmed.html',
  styleUrl: './email-confirmed.css',
})
export class EmailConfirmed implements OnInit {
  confirmationState: ConfirmationState = 'verifying';
  readonly text = this.getPageText();

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    const tokenHash = this.route.snapshot.queryParamMap.get('token_hash');

    if (!tokenHash) {
      this.confirmationState = 'success';
      return;
    }

    const type = this.getEmailOtpType(this.route.snapshot.queryParamMap.get('type'));

    try {
      const { error } = await this.verifyEmail(tokenHash, type);

      if (error) {
        throw error;
      }

      await this.authService.loadUserFromSession();
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });

      this.confirmationState = 'success';
    } catch (error) {
      console.error('Erro ao confirmar email:', error);
      this.confirmationState = 'error';
    }
  }

  close(): void {
    const destination = this.authService.isAuthenticated() ? '/app/dashboard' : '/login';
    void this.router.navigate([destination]);
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }

  private async verifyEmail(tokenHash: string, type: EmailOtpType) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!result.error || type !== 'email') {
      return result;
    }

    return supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'signup',
    });
  }

  private getEmailOtpType(type: string | null): EmailOtpType {
    const validTypes: EmailOtpType[] = [
      'signup',
      'invite',
      'magiclink',
      'recovery',
      'email_change',
      'email',
    ];

    return validTypes.includes(type as EmailOtpType) ? (type as EmailOtpType) : 'email';
  }

  private getPageText(): ConfirmationText {
    if ((globalThis.location?.pathname ?? '').startsWith('/en/email-confirmed')) {
      return {
        eyebrow: 'Account verification',
        heroTitle: 'Welcome to SIGA',
        heroDescription: 'We are confirming your email and preparing your access.',
        closeLabel: 'Close message',
        verifyingTitle: 'Confirming your email',
        verifyingDescription: 'Please wait while we verify your account.',
        successTitle: 'Account verified successfully',
        successDescription: 'Your email has been confirmed. You can now sign in and start using the platform.',
        errorTitle: 'We could not verify the account',
        errorDescription:
          'This confirmation link may have expired or already been used. Please try signing in or request a new confirmation email.',
        continueLabel: 'Continue',
        loginLabel: 'Go to login',
      };
    }

    return {
      eyebrow: 'Conta verificada',
      heroTitle: 'Bem-vindo ao SIGA',
      heroDescription: 'Estamos a confirmar o seu email e a preparar o acesso.',
      closeLabel: 'Fechar mensagem',
      verifyingTitle: 'A confirmar o seu email',
      verifyingDescription: 'Aguarde enquanto verificamos a sua conta.',
      successTitle: 'Conta verificada com sucesso',
      successDescription: 'O seu email foi confirmado. Ja pode iniciar sessao e comecar a utilizar a plataforma.',
      errorTitle: 'Nao foi possivel verificar a conta',
      errorDescription:
        'Este link de confirmacao pode ter expirado ou ja ter sido utilizado. Tente iniciar sessao ou pedir um novo email de confirmacao.',
      continueLabel: 'Continuar',
      loginLabel: 'Ir para login',
    };
  }
}
