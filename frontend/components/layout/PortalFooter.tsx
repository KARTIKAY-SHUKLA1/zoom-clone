export default function PortalFooter() {
  const groups = {
    About: ['Zoom Blog', 'Customers', 'Our Team', 'Careers', 'Integrations', 'Partners', 'Investors', 'Press', 'Sustainability & ESG', 'Zoom Cares', 'Media Kit', 'How to Videos', 'Developer Platform'],
    Download: ['Zoom Workplace App', 'Zoom Rooms App', 'Zoom Rooms Controller', 'Browser Extension', 'Outlook Plug-in', 'iPhone/iPad App', 'Android App', 'Zoom Virtual Backgrounds'],
    Sales: ['1.888.799.9666', 'Contact Sales', 'Plans & Pricing', 'Request a Demo', 'Webinars and Events'],
    Support: ['Test Zoom', 'Account', 'Support Center', 'Learning Center', 'Zoom Community', 'Contact Us', 'Accessibility', 'Developer Support', 'Privacy, Security, Legal Policies', 'Transparency Statement'],
  }
  return <footer className="portal-footer"><div className="footer-columns">{Object.entries(groups).map(([title, links]) => <div key={title}><h3>{title}</h3>{links.map(label => <span key={label}>{label}</span>)}</div>)}<div><h3>Language</h3><select aria-label="Language"><option>English</option></select><h3 className="mt-6">Currency</h3><select aria-label="Currency"><option>US Dollars $</option></select></div></div><div className="footer-legal">Copyright ©{new Date().getFullYear()} Zoom Communications, Inc. All rights reserved. <span>Terms · Privacy · Trust Center · Acceptable Use Guidelines · Legal & Compliance</span></div></footer>
}
