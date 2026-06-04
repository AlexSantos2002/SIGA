import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener } from '@angular/core';

type LocaleCode = 'pt' | 'en';

interface LanguageOption {
  code: LocaleCode;
  shortLabel: string;
  label: string;
}

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css',
})
export class LanguageSwitcher {
  isOpen = false;

  readonly languages: LanguageOption[] = [
    { code: 'pt', shortLabel: 'PT', label: 'Português' },
    { code: 'en', shortLabel: 'EN', label: 'English' },
  ];

  constructor(private host: ElementRef<HTMLElement>) {}

  get currentLocale(): LocaleCode {
    return this.isEnglishPath(window.location.pathname) ? 'en' : 'pt';
  }

  get currentLanguage(): LanguageOption {
    return (
      this.languages.find((language) => language.code === this.currentLocale) ?? this.languages[0]
    );
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  closeMenu(): void {
    this.isOpen = false;
  }

  changeLanguage(locale: LocaleCode): void {
    this.isOpen = false;

    if (locale === this.currentLocale) {
      return;
    }

    window.location.href = this.getLocalizedUrl(locale);
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (this.host.nativeElement.contains(event.target as Node)) {
      return;
    }

    this.closeMenu();
  }

  private getLocalizedUrl(locale: LocaleCode): string {
    const { pathname, search, hash } = window.location;
    const pathWithoutLocale = this.isEnglishPath(pathname)
      ? pathname.replace(/^\/en(?=\/|$)/, '')
      : pathname;
    const normalizedPath = pathWithoutLocale || '/';
    const localizedPath =
      locale === 'en' ? `/en${normalizedPath === '/' ? '/' : normalizedPath}` : normalizedPath;

    return `${localizedPath}${search}${hash}`;
  }

  private isEnglishPath(pathname: string): boolean {
    return pathname === '/en' || pathname.startsWith('/en/');
  }
}
