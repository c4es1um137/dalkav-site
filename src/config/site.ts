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
  fullName: 'Ahmet Bahadır Balcı',
  email: {
    // Encodes "contact" (reversed, then base64).
    user: 'dGNhdG5vYw==',
    // Encodes "dalkav.uk".
    domain: 'a3UudmFrbGFk',
  },
  /** Profile links; an empty string hides the link. */
  github: 'https://github.com/c4es1um137',
  linkedin: 'https://www.linkedin.com/in/abahadirbalci/',
  /** GitHub repository, used for "source" links on lab tools. */
  repo: 'https://github.com/c4es1um137/dalkav-site',
  cv: {
    en: '/cv/bahadir-cv-en.pdf',
    tr: '/cv/bahadir-cv-tr.pdf',
  },
};
