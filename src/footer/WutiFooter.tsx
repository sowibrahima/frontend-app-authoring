import React from 'react';
import { defineMessages, useIntl } from '@edx/frontend-platform/i18n';
import { Link } from 'react-router-dom';
import { getPublicSiteUrl } from '../publicSiteLinks';

const messages = defineMessages({
  copyright: {
    id: 'wuti.footer.copyright',
    defaultMessage: '© {year} WutiSkill Inc. All rights reserved.',
    description: 'WutiSkill footer copyright.',
  },
  footerNav: {
    id: 'wuti.footer.nav',
    defaultMessage: 'Footer links',
    description: 'Accessible label for the footer navigation.',
  },
  faq: {
    id: 'wuti.footer.faq',
    defaultMessage: 'FAQ',
    description: 'Footer FAQ link label.',
  },
  help: {
    id: 'wuti.footer.help',
    defaultMessage: 'Help center',
    description: 'Footer help link label.',
  },
  terms: {
    id: 'wuti.footer.terms',
    defaultMessage: 'Terms',
    description: 'Footer terms link label.',
  },
  privacy: {
    id: 'wuti.footer.privacy',
    defaultMessage: 'Privacy',
    description: 'Footer privacy link label.',
  },
});

const WutiFooter = () => {
  const intl = useIntl();
  const currentYear = new Date().getFullYear();
  const footerLinks = [
    {
      label: intl.formatMessage(messages.faq),
      to: '/faq',
    },
    {
      label: intl.formatMessage(messages.help),
      href: getPublicSiteUrl('/help'),
    },
    {
      label: intl.formatMessage(messages.terms),
      href: getPublicSiteUrl('/legal/terms'),
    },
    {
      label: intl.formatMessage(messages.privacy),
      href: getPublicSiteUrl('/legal/privacy'),
    },
  ].filter((link) => Boolean(link.to || link.href));

  return (
    <footer className="ws-minimal-footer">
      <div className="ws-minimal-footer__inner">
        <p className="ws-minimal-footer__copyright">
          {intl.formatMessage(messages.copyright, { year: currentYear })}
        </p>
        {footerLinks.length ? (
          <nav className="ws-minimal-footer__links" aria-label={intl.formatMessage(messages.footerNav)}>
            {footerLinks.map((link) => (
              link.to ? (
                <Link key={link.label} to={link.to} className="ws-minimal-footer__link">
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href || undefined} className="ws-minimal-footer__link">
                  {link.label}
                </a>
              )
            ))}
          </nav>
        ) : null}
      </div>
    </footer>
  );
};

export default WutiFooter;
