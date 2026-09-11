interface ContactsLayoutProps {
  children: React.ReactNode;
}

export const ContactsLayout = ({ children }: Readonly<ContactsLayoutProps>) => {
  return <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>;
};

export default ContactsLayout;
