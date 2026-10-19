import type * as React from 'react';

export type IconName = 'arrow-right' | 'check' | 'plus' | 'minus' | 'menu' | 'x' | 'chevron-down' | 'calendar-check' | 'clipboard-list' | 'message-circle-question' | 'search' | 'shield-check' | 'refresh-cw' | 'life-buoy' | 'receipt' | 'user' | 'image' | 'circle-check' | 'mail' | 'video' | 'clock' | 'file-text' | 'external-link' | 'globe' | 'laptop' | 'smartphone';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: czarna pigułka na jasnym tle · outline: czarny obrys · accent: błękitna pigułka na czerni · outline-light: kremowy obrys na czerni */
  variant?: 'primary' | 'outline' | 'accent' | 'outline-light';
  /** md: 52 px (domyślnie) · sm: 44 px, w menu i stopce */
  size?: 'md' | 'sm';
  /** strzałka po prawej, przesuwa się o 4 px po najechaniu */
  arrow?: boolean;
  /** na całą szerokość rodzica, na telefonie i w kartach pakietów */
  full?: boolean;
  /** gdy podany, renderuje link <a> */
  href?: string;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface ArrowLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> { children?: React.ReactNode }
export declare function ArrowLink(props: ArrowLinkProps): React.ReactElement;

export interface EyebrowProps { children?: React.ReactNode; /** błękitna kropka przed tekstem (domyślnie true) */ dot?: boolean; className?: string }
export declare function Eyebrow(props: EyebrowProps): React.ReactElement;

export interface AccentProps { children?: React.ReactNode; className?: string }
export declare function Accent(props: AccentProps): React.ReactElement;

export interface TagProps { tone?: 'blue' | 'sand' | 'black' | 'outline'; children?: React.ReactNode; className?: string }
export declare function Tag(props: TagProps): React.ReactElement;

export interface IconProps { name: IconName; size?: number; strokeWidth?: number; /** gdy ikona niesie treść bez podpisu */ label?: string; className?: string }
export declare function Icon(props: IconProps): React.ReactElement;

export interface IconCircleProps { name: IconName; label?: string; className?: string }
export declare function IconCircle(props: IconCircleProps): React.ReactElement;

export interface CardProps extends React.HTMLAttributes<HTMLElement> { tone?: 'sand' | 'dashed'; as?: 'div' | 'article' | 'section' | 'li'; children?: React.ReactNode }
export declare function Card(props: CardProps): React.ReactElement;

export interface BranchCardProps { number?: string; category?: string; title: string; text?: string; tags?: string[]; linkLabel?: string; href?: string; className?: string }
export declare function BranchCard(props: BranchCardProps): React.ReactElement;

export interface PackageCardProps {
  name: string;
  /** np. "1 800" z twardą spacją */
  price: string;
  currency?: string;
  forWhom?: string;
  /** pierwszy wiersz listy: „Wszystko z poprzedniego pakietu, plus:” */
  includesPrevious?: boolean;
  includesPreviousLabel?: string;
  items?: string[];
  recommended?: boolean;
  recommendedLabel?: string;
  buttonLabel?: string;
  href?: string;
  className?: string;
}
export declare function PackageCard(props: PackageCardProps): React.ReactElement;

export interface TrustBarProps { items: { icon?: IconName; label: string }[]; className?: string }
export declare function TrustBar(props: TrustBarProps): React.ReactElement;

export interface ProcessStepProps { number: string; title: string; text?: string; className?: string }
export declare function ProcessStep(props: ProcessStepProps): React.ReactElement;

export interface FaqItemProps { question: string; answer?: React.ReactNode; /** odpowiedź jako treść elementu, np. z linkiem; ma pierwszeństwo przed `answer` */ children?: React.ReactNode; open?: boolean; className?: string }
export declare function FaqItem(props: FaqItemProps): React.ReactElement;

export interface CtaBandProps { title?: React.ReactNode; /** nagłówek jako treść elementu, ze słowem w `Accent`; ma pierwszeństwo przed `title` */ children?: React.ReactNode; text?: string; primaryLabel?: string; primaryHref?: string; secondaryLabel?: string; secondaryHref?: string; className?: string }
export declare function CtaBand(props: CtaBandProps): React.ReactElement;

export interface LogoProps { name?: string; href?: string; className?: string }
export declare function Logo(props: LogoProps): React.ReactElement;

export interface SiteHeaderProps { items?: { label: string; href?: string; menu?: boolean; current?: boolean }[]; buttonLabel?: string; buttonHref?: string; logoHref?: string; /** zawsze wersja na telefon: logo i przycisk menu; bez tego menu samo przechodzi w nią poniżej 641 px */ compact?: boolean; className?: string }
export declare function SiteHeader(props: SiteHeaderProps): React.ReactElement;

export type LinkItem = string | { label: string; href?: string };

export interface BreadcrumbsProps { /** od strony głównej do bieżącej; ostatnia pozycja to bieżąca strona, bez linku */ items: LinkItem[]; /** opis nawigacji dla czytników ekranu, domyślnie „Okruszki” */ label?: string; className?: string }
export declare function Breadcrumbs(props: BreadcrumbsProps): React.ReactElement;

export interface SiteFooterProps { tagline?: string; buttonLabel?: string; buttonHref?: string; logoHref?: string; columns?: { title: string; items: LinkItem[] }[]; legal?: string[]; links?: LinkItem[]; className?: string }
export declare function SiteFooter(props: SiteFooterProps): React.ReactElement;

export interface MobileCtaBarProps { /** napis przycisku; domyślnie „Wyceń stronę w 5 minut” */ label?: string; children?: React.ReactNode; href?: string; className?: string }
export declare function MobileCtaBar(props: MobileCtaBarProps): React.ReactElement;

export interface PhoneFrameProps { width?: number; height?: number; /** pasek „Projekt demonstracyjny” u góry ekranu (domyślnie true; poniżej 200 px szerokości napis „Demo”) */ demo?: boolean; demoLabel?: string; children?: React.ReactNode; className?: string }
export declare function PhoneFrame(props: PhoneFrameProps): React.ReactElement;

export interface LaptopFrameProps { /** pasek „Projekt demonstracyjny” u góry ekranu (domyślnie true) */ demo?: boolean; demoLabel?: string; children?: React.ReactNode; className?: string }
export declare function LaptopFrame(props: LaptopFrameProps): React.ReactElement;

declare global {
  interface Window {
    MP: {
      Button: typeof Button; ArrowLink: typeof ArrowLink; Eyebrow: typeof Eyebrow; Accent: typeof Accent; Tag: typeof Tag;
      Icon: typeof Icon; IconCircle: typeof IconCircle; Card: typeof Card; BranchCard: typeof BranchCard; PackageCard: typeof PackageCard;
      TrustBar: typeof TrustBar; ProcessStep: typeof ProcessStep; FaqItem: typeof FaqItem; CtaBand: typeof CtaBand;
      Logo: typeof Logo; SiteHeader: typeof SiteHeader; Breadcrumbs: typeof Breadcrumbs; SiteFooter: typeof SiteFooter; MobileCtaBar: typeof MobileCtaBar; PhoneFrame: typeof PhoneFrame; LaptopFrame: typeof LaptopFrame;
    };
  }
}
