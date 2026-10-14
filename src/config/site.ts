// Owner details used across the site.
// The repo is public: the contact address is stored only as encoded parts
// (each part reversed, then base64). It is decoded in the browser by
// src/scripts/email.ts. To encode a part, run:
//   node -e "console.log(Buffer.from([...process.argv[1]].reverse().join('')).toString('base64'))" your-part

interface SiteConfig {
  name: string;
  fullName: string;
  email: { user: string; domain: string };
  github: string;
  linkedin: string;
  repo: string;
  cv: { en: string; tr: string };
}

export const site: SiteConfig = {
  name: 'Bahadır',
  /** Full name for the CV and JSON-LD. */
  fullName: 'Bahadır [TODO: surname]',
  email: {
    // [TODO: replace with the encoded local part of your address; currently encodes "name"]
    user: 'ZW1hbg==',
    // Encodes "dalkav.uk".
    domain: 'a3UudmFrbGFk',
  },
  /** Leave empty until known; the site then shows a visible [TODO] instead of a broken link. */
  github: '', // [TODO: GitHub profile URL, e.g. https://github.com/<username>]
  linkedin: '', // [TODO: LinkedIn profile URL]
  /** GitHub repository, used for "source" links on lab tools. */
  repo: '', // [TODO: repository URL, e.g. https://github.com/<username>/dalkav-site]
  cv: {
    en: '/cv/bahadir-cv-en.pdf',
    tr: '/cv/bahadir-cv-tr.pdf',
  },
};
