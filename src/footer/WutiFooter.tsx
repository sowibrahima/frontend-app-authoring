import React from 'react';
import { getPublicSiteUrl } from '../publicSiteLinks';

const WutiFooter = () => {
  const currentYear = new Date().getFullYear();
  const footerLinks = [
    {
      label: 'FAQ',
      href: getPublicSiteUrl('/faq'),
    },
    {
      label: 'Centre d’aide',
      href: getPublicSiteUrl('/help'),
    },
    {
      label: 'Conditions',
      href: getPublicSiteUrl('/legal/terms'),
    },
    {
      label: 'Confidentialité',
      href: getPublicSiteUrl('/legal/privacy'),
    },
  ].filter((link) => Boolean(link.href));

  return (
    <footer className="ws-minimal-footer">
      <div className="ws-minimal-footer__inner">
        <p className="ws-minimal-footer__copyright">
          © {currentYear} WutiSkill Inc. Tous droits réservés.
        </p>
        {footerLinks.length ? (
          <nav className="ws-minimal-footer__links" aria-label="Liens du pied de page">
            {footerLinks.map((link) => (
              <a key={link.label} href={link.href || undefined} className="ws-minimal-footer__link">
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </footer>
  );
};

export default WutiFooter;
